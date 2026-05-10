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
exports.DepositWizard = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const vanish_service_1 = require("../vanish/vanish.service");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const tokens_1 = require("../../common/constants/tokens");
let DepositWizard = class DepositWizard {
    vanishService;
    prisma;
    constructor(vanishService, prisma) {
        this.vanishService = vanishService;
        this.prisma = prisma;
    }
    async step1(ctx) {
        await ctx.reply('📥 *B2 Agent: Private Deposit*\n\n' +
            'To move in silence, you must first fund your **Vanish Stealth Profile**.\n\n' +
            'Which token would you like to deposit?', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'SOL', callback_data: 'deposit:SOL' }],
                    [{ text: 'USDC', callback_data: 'deposit:USDC' }],
                ]
            }
        });
        ctx.wizard.next();
    }
    async step2(ctx) {
        const data = ctx.callbackQuery.data;
        if (!data || !data.startsWith('deposit:'))
            return;
        const token = data.split(':')[1];
        await ctx.answerCbQuery();
        await ctx.editMessageText(`🛰️ *Generating Stealth Address for ${token}...*`, { parse_mode: 'Markdown' });
        try {
            const mint = token === 'SOL' ? tokens_1.TOKENS.SOL : tokens_1.TOKENS.USDC_MAINNET;
            const address = await this.vanishService.getDepositAddress(mint);
            const user = await this.prisma.user.findUnique({
                where: { telegramId: ctx.from?.id.toString() }
            });
            await ctx.reply(`✅ *Your Private Deposit Addresses*\n\n` +
                `1️⃣ *Manual Ghost Swaps*\n` +
                `Address: \`${address}\`\n` +
                `_Funds sent here are linked to your Main Wallet._\n\n` +
                `2️⃣ *Automated DCA & Limit*\n` +
                `Address: \`${user?.agentPublicKey}\`\n` +
                `_Funds sent here enable autonomous moves without manual signing._\n\n` +
                `⚠️ *Instructions*:\n` +
                `• Only send ${token} on Solana Mainnet.\n` +
                `• For Automation, fund your **Agent Wallet** (#2).\n` +
                `• Once confirmed, your B2 Agent will move in silence.`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                            { text: 'Done', callback_data: 'menu:start' }
                        ]]
                }
            });
        }
        catch (error) {
            await ctx.reply(`❌ Failed to generate address: ${error.message}`);
        }
        return ctx.scene.leave();
    }
};
exports.DepositWizard = DepositWizard;
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(1),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DepositWizard.prototype, "step1", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(2),
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DepositWizard.prototype, "step2", null);
exports.DepositWizard = DepositWizard = __decorate([
    (0, nestjs_telegraf_1.Wizard)('deposit-wizard'),
    __metadata("design:paramtypes", [vanish_service_1.VanishService,
        prisma_service_1.PrismaService])
], DepositWizard);
//# sourceMappingURL=deposit.wizard.js.map