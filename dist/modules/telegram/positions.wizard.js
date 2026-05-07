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
exports.PositionsWizard = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const rpc_service_1 = require("../rpc/rpc.service");
const config_1 = require("@nestjs/config");
const tokens_1 = require("../../common/constants/tokens");
let PositionsWizard = class PositionsWizard {
    prisma;
    rpcService;
    configService;
    constructor(prisma, rpcService, configService) {
        this.prisma = prisma;
        this.rpcService = rpcService;
        this.configService = configService;
    }
    async step1(ctx) {
        const user = await this.prisma.user.findUnique({ where: { telegramId: ctx.from?.id.toString() } });
        if (!user?.solanaPublicKey) {
            await ctx.reply('⚠️ Please link your wallet first using /link');
            return ctx.scene.leave();
        }
        const tokens = await this.rpcService.getTokensForWallet(user.solanaPublicKey);
        if (tokens.length === 0) {
            await ctx.reply('You have no active token positions.');
            return ctx.scene.leave();
        }
        const buttons = tokens.map(t => {
            const symbol = Object.keys(tokens_1.TOKENS).find(k => tokens_1.TOKENS[k] === t.mint) || t.mint.substring(0, 4);
            return [{ text: `${symbol}: ${t.amount.toFixed(2)}`, callback_data: `pos:${t.mint}:${symbol}:${t.amount}` }];
        });
        await ctx.reply('🛡️ *Your Active Positions*\n\n' +
            'Select a token to manage its private exit strategy (TP/SL).', {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
        });
        ctx.wizard.next();
    }
    async step2(ctx) {
        const data = ctx.callbackQuery.data;
        const [, mint, symbol, amount] = data.split(':');
        ctx.wizard.state.mint = mint;
        ctx.wizard.state.symbol = symbol;
        ctx.wizard.state.amount = parseFloat(amount);
        await ctx.answerCbQuery();
        await ctx.reply(`🛡️ *Managing ${symbol}*\n\n` +
            `Current Balance: ${amount}\n\n` +
            `What would you like to set?`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📈 Take Profit (USD)', callback_data: 'set:tp' }],
                    [{ text: '📉 Stop Loss (USD)', callback_data: 'set:sl' }],
                    [{ text: '🛡️ Set Both', callback_data: 'set:both' }],
                ]
            }
        });
        ctx.wizard.next();
    }
    async step3(ctx) {
        const data = ctx.callbackQuery.data;
        const mode = data.split(':')[1];
        ctx.wizard.state.mode = mode;
        await ctx.answerCbQuery();
        if (mode === 'tp' || mode === 'both') {
            await ctx.reply(`Enter **Take Profit** price (USD):`);
        }
        else {
            await ctx.reply(`Enter **Stop Loss** price (USD):`);
        }
        ctx.wizard.next();
    }
    async step4(ctx, msg) {
        const val = parseFloat(msg.text);
        if (isNaN(val) || val <= 0) {
            await ctx.reply('Please enter a valid price:');
            return;
        }
        const state = ctx.wizard.state;
        if (state.mode === 'tp') {
            state.tp = val;
            return this.finish(ctx);
        }
        else if (state.mode === 'sl') {
            state.sl = val;
            return this.finish(ctx);
        }
        else if (state.mode === 'both') {
            if (!state.tp) {
                state.tp = val;
                await ctx.reply(`Enter **Stop Loss** price (USD):`);
                return;
            }
            else {
                state.sl = val;
                return this.finish(ctx);
            }
        }
    }
    async finish(ctx) {
        const state = ctx.wizard.state;
        const frontendUrl = this.configService.get('FRONTEND_URL');
        await ctx.reply(`🛡️ *Position Protection Summary*\n\n` +
            `Token: ${state.symbol}\n` +
            `Take Profit: ${state.tp ? `$${state.tp}` : 'Not set'}\n` +
            `Stop Loss: ${state.sl ? `$${state.sl}` : 'Not set'}\n\n` +
            `_Authorize to sync these levels with the B2 Trigger Engine._`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                        {
                            text: '🛡️ Sync Protection',
                            web_app: {
                                url: `${frontendUrl}/tpsl?userId=${ctx.from?.id}&mint=${state.mint}&amount=${state.amount}&tp=${state.tp || ''}&sl=${state.sl || ''}`
                            }
                        }
                    ]]
            }
        });
        return ctx.scene.leave();
    }
};
exports.PositionsWizard = PositionsWizard;
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(1),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PositionsWizard.prototype, "step1", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(2),
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PositionsWizard.prototype, "step2", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(3),
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PositionsWizard.prototype, "step3", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(4),
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __param(1, (0, nestjs_telegraf_1.Message)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PositionsWizard.prototype, "step4", null);
exports.PositionsWizard = PositionsWizard = __decorate([
    (0, nestjs_telegraf_1.Wizard)('positions-wizard'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rpc_service_1.RpcService,
        config_1.ConfigService])
], PositionsWizard);
//# sourceMappingURL=positions.wizard.js.map