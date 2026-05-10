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
exports.RebalanceWizard = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const rpc_service_1 = require("../rpc/rpc.service");
const orchestrator_service_1 = require("../orchestrator/orchestrator.service");
const tokens_1 = require("../../common/constants/tokens");
let RebalanceWizard = class RebalanceWizard {
    prisma;
    rpcService;
    orchestratorService;
    constructor(prisma, rpcService, orchestratorService) {
        this.prisma = prisma;
        this.rpcService = rpcService;
        this.orchestratorService = orchestratorService;
    }
    async step1(ctx) {
        const user = await this.prisma.user.findUnique({ where: { telegramId: ctx.from?.id.toString() } });
        if (!user?.solanaPublicKey) {
            await ctx.reply('⚠️ Please link your wallet first using /link');
            return ctx.scene.leave();
        }
        await ctx.reply('🔍 *B2 Agent: Scanning Assets...*', { parse_mode: 'Markdown' });
        const solBalance = await this.rpcService.getBalance(user.solanaPublicKey);
        const tokens = await this.rpcService.getTokensForWallet(user.solanaPublicKey);
        const buttons = [];
        if (solBalance > 0) {
            buttons.push([{ text: `SOL (${solBalance.toFixed(2)})`, callback_data: `add:SOL` }]);
        }
        const knownMints = {
            [tokens_1.TOKENS.USDC_MAINNET]: 'USDC',
        };
        tokens.forEach(t => {
            const symbol = knownMints[t.mint] || t.mint.substring(0, 4);
            buttons.push([{ text: `${symbol} (${t.amount.toFixed(2)})`, callback_data: `add:${symbol}` }]);
        });
        ctx.wizard.state.targets = {};
        await ctx.reply('⚖️ *Private Rebalancer*\n\n' +
            'Select the tokens you want to include in your **Target Portfolio**.\n\n' +
            '_The agent will sell overweight assets and buy underweight ones privately._', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [...buttons, [{ text: '✅ Finish Selection', callback_data: 'done' }]]
            }
        });
        ctx.wizard.next();
    }
    async step2(ctx) {
        const data = ctx.callbackQuery.data;
        const state = ctx.wizard.state;
        if (data === 'done') {
            const targets = Object.keys(state.targets);
            if (targets.length === 0) {
                await ctx.answerCbQuery('Select at least one token.', { show_alert: true });
                return;
            }
            state.currentIdx = 0;
            await ctx.reply(`🎯 Target Allocation for *${targets[0]}* (%):`, { parse_mode: 'Markdown' });
            ctx.wizard.next();
            return;
        }
        const symbol = data.split(':')[1];
        state.targets[symbol] = 0;
        await ctx.answerCbQuery(`Added ${symbol}`);
    }
    async step3(ctx, msg) {
        const weight = parseFloat(msg.text);
        const state = ctx.wizard.state;
        const symbols = Object.keys(state.targets);
        if (isNaN(weight) || weight < 0 || weight > 100) {
            await ctx.reply('Please enter a number between 0 and 100:');
            return;
        }
        state.targets[symbols[state.currentIdx]] = weight;
        state.currentIdx++;
        if (state.currentIdx < symbols.length) {
            await ctx.reply(`🎯 Target Allocation for *${symbols[state.currentIdx]}* (%):`, { parse_mode: 'Markdown' });
        }
        else {
            const total = Object.values(state.targets).reduce((a, b) => a + b, 0);
            if (Math.abs(total - 100) > 0.1) {
                await ctx.reply(`❌ Error: Weights total ${total}%. They must sum to **100%**.\n\nRestarting selection...`);
                return ctx.scene.reenter();
            }
            const summary = Object.entries(state.targets).map(([k, v]) => `• ${k.replace(/_/g, '\\_')}: ${v}%`).join('\n');
            const processingMsg = await ctx.reply(`🚀 *Move Authorized*\n\n` +
                `Target Portfolio:\n${summary}\n\n` +
                `_Orchestrating stealth trades via Vanish + Jupiter..._`, { parse_mode: 'Markdown' });
            const intent = await this.prisma.rebalanceIntent.create({
                data: {
                    userId: ctx.from?.id.toString(),
                    targetWeights: JSON.stringify(state.targets),
                    slippage: 0.5,
                    status: 'PENDING',
                    messageId: processingMsg.message_id
                }
            });
            await this.orchestratorService.addRebalanceToQueue(intent.id, ctx.from?.id.toString(), processingMsg.message_id);
            return ctx.scene.leave();
        }
    }
};
exports.RebalanceWizard = RebalanceWizard;
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(1),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RebalanceWizard.prototype, "step1", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(2),
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RebalanceWizard.prototype, "step2", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(3),
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __param(1, (0, nestjs_telegraf_1.Message)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RebalanceWizard.prototype, "step3", null);
exports.RebalanceWizard = RebalanceWizard = __decorate([
    (0, nestjs_telegraf_1.Wizard)('rebalance-wizard'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rpc_service_1.RpcService,
        orchestrator_service_1.OrchestratorService])
], RebalanceWizard);
//# sourceMappingURL=rebalance.wizard.js.map