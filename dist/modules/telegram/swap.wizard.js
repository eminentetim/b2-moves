"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapWizard = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const rpc_service_1 = require("../rpc/rpc.service");
const tokens_1 = require("../../common/constants/tokens");
let SwapWizard = class SwapWizard {
    configService;
    prisma;
    rpcService;
    constructor(configService, prisma, rpcService) {
        this.configService = configService;
        this.prisma = prisma;
        this.rpcService = rpcService;
    }
    async step1(ctx) {
        const telegramId = ctx.from?.id.toString();
        const user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user || !user.solanaPublicKey) {
            await ctx.reply('⚠️ Wallet not linked. Please use /link first to activate your stealth profile.');
            return ctx.scene.leave();
        }
        await ctx.reply('🔍 Scanning your stealth wallet for assets...');
        const solBalance = await this.rpcService.getBalance(user.solanaPublicKey);
        const tokens = await this.rpcService.getTokensForWallet(user.solanaPublicKey);
        const buttons = [];
        if (solBalance > 0) {
            buttons.push([{ text: `SOL (${solBalance.toFixed(3)})`, callback_data: `select:SOL:${tokens_1.TOKENS.SOL}` }]);
        }
        const knownMints = {
            [tokens_1.TOKENS.USDC_DEVNET]: 'USDC',
            [tokens_1.TOKENS.USDT_DEVNET]: 'USDT',
            [tokens_1.TOKENS.USDC_MAINNET]: 'USDC',
        };
        tokens.forEach(t => {
            const symbol = knownMints[t.mint] || t.mint.substring(0, 4) + '...';
            buttons.push([{ text: `${symbol} (${t.amount.toFixed(2)})`, callback_data: `select:${symbol}:${t.mint}` }]);
        });
        if (buttons.length === 0) {
            await ctx.reply('👻 Your wallet is empty. Deposit some funds to start moving.');
            return ctx.scene.leave();
        }
        await ctx.reply('Ghost Swap Mode Activated 👻\n\nWhich token would you like to sell?', {
            reply_markup: {
                inline_keyboard: buttons
            }
        });
        ctx.wizard.next();
    }
    async step2(ctx) {
        const data = ctx.callbackQuery.data;
        if (!data || !data.startsWith('select:'))
            return;
        const [, symbol, mint] = data.split(':');
        ctx.wizard.state.inputToken = symbol;
        ctx.wizard.state.inputMint = mint;
        await ctx.editMessageText(`Selected: *${symbol}*\n\nNow, what token would you like to receive?`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'USDC', callback_data: `target:USDC:${tokens_1.TOKENS.USDC_DEVNET}` }],
                    [{ text: 'SOL', callback_data: `target:SOL:${tokens_1.TOKENS.SOL}` }],
                ]
            }
        });
        ctx.wizard.next();
    }
    async step3(ctx) {
        const data = ctx.callbackQuery.data;
        if (!data || !data.startsWith('target:'))
            return;
        const [, symbol, mint] = data.split(':');
        ctx.wizard.state.outputToken = symbol;
        ctx.wizard.state.outputMint = mint;
        await ctx.editMessageText(`Input: *${ctx.wizard.state.inputToken}*\nOutput: *${symbol}*\n\nHow much ${ctx.wizard.state.inputToken} do you want to swap?`, {
            parse_mode: 'Markdown'
        });
        ctx.wizard.next();
    }
    async step4(ctx, msg) {
        const amount = parseFloat(msg.text);
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('Please enter a valid positive number:');
            return;
        }
        const state = ctx.wizard.state;
        state.amount = amount;
        const frontendUrl = this.configService.get('FRONTEND_URL');
        const summaryMsg = await ctx.reply(`🎯 *Swap Summary*:\n\n` +
            `*Sell*: ${state.amount} ${state.inputToken}\n` +
            `*Receive*: ${state.outputToken}\n` +
            `*Privacy*: Vanish Level 3 (Maximum)\n\n` +
            `To execute this trade, please sign the intent:`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                        {
                            text: '✍️ Sign & Execute Move',
                            web_app: { url: `${frontendUrl}/sign?amount=${state.amount}&in=${state.inputToken}&out=${state.outputToken}&userId=${ctx.from?.id}&msgId=${0}` }
                        }
                    ]]
            }
        });
        await ctx.telegram.editMessageReplyMarkup(ctx.chat?.id, summaryMsg.message_id, undefined, {
            inline_keyboard: [[
                    {
                        text: '✍️ Sign & Execute Move',
                        web_app: { url: `${frontendUrl}/sign?amount=${state.amount}&in=${state.inputToken}&out=${state.outputToken}&userId=${ctx.from?.id}&msgId=${summaryMsg.message_id}` }
                    }
                ]]
        });
        return ctx.scene.leave();
    }
};
exports.SwapWizard = SwapWizard;
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(1),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SwapWizard.prototype, "step1", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(2),
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SwapWizard.prototype, "step2", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(3),
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SwapWizard.prototype, "step3", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(4),
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __param(1, (0, nestjs_telegraf_1.Message)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SwapWizard.prototype, "step4", null);
exports.SwapWizard = SwapWizard = __decorate([
    (0, nestjs_telegraf_1.Wizard)('swap-wizard'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        rpc_service_1.RpcService])
], SwapWizard);
//# sourceMappingURL=swap.wizard.js.map