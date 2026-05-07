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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramUpdate = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const telegram_rate_limiter_guard_1 = require("./telegram-rate-limiter.guard");
const prisma_service_1 = require("../../database/prisma/prisma.service");
let TelegramUpdate = class TelegramUpdate {
    configService;
    prisma;
    logger = new common_1.Logger('TelegramBot');
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
    }
    async onStart(ctx) {
        const telegramId = ctx.from?.id.toString();
        const user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user || !user.solanaPublicKey) {
            await ctx.scene.enter('onboarding-wizard');
            return;
        }
        await ctx.reply(`Welcome back, Agent. 🛸\n\nYour stealth link is active. What move would you like to make?`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔀 Ghost Swap', callback_data: 'menu:swap' }],
                    [{ text: '⚖️ Private Rebalance', callback_data: 'menu:rebalance' }],
                    [{ text: '🎯 Limit Order', callback_data: 'menu:limit' }],
                    [{ text: '🔁 DCA Strategy', callback_data: 'menu:dca' }],
                    [{ text: '🛡️ My Positions', callback_data: 'menu:positions' }],
                    [{ text: '👤 My Identity', callback_data: 'menu:identity' }]
                ]
            }
        });
    }
    async onMenuSelection(ctx) {
        const data = ctx.callbackQuery.data;
        if (!data || !data.startsWith('menu:'))
            return;
        const action = data.split(':')[1];
        if (action === 'swap') {
            await ctx.answerCbQuery();
            await ctx.scene.enter('swap-wizard');
        }
        else if (action === 'rebalance') {
            await ctx.answerCbQuery();
            await ctx.scene.enter('rebalance-wizard');
        }
        else if (action === 'limit') {
            await ctx.answerCbQuery();
            await ctx.scene.enter('limit-order-wizard');
        }
        else if (action === 'dca') {
            await ctx.answerCbQuery();
            await ctx.scene.enter('dca-wizard');
        }
        else if (action === 'positions') {
            await ctx.answerCbQuery();
            await ctx.scene.enter('positions-wizard');
        }
        else if (action === 'identity') {
            const user = await this.prisma.user.findUnique({ where: { telegramId: ctx.from?.id.toString() } });
            await ctx.answerCbQuery();
            await ctx.reply(`🛡️ *Identity Status*\n\nLinked Wallet: \`${user?.solanaPublicKey}\`\nStatus: Stealth Active`, { parse_mode: 'Markdown' });
        }
    }
    async onSwap(ctx) {
        await ctx.scene.enter('swap-wizard');
    }
    async onLink(ctx) {
        const frontendUrl = this.configService.get('FRONTEND_URL');
        await ctx.reply('🛸 *B2 Onboarding: Stealth Activation*\n\nTap the button to link your Solana identity.', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                        { text: '🛡️ Activate Stealth Link', web_app: { url: `${frontendUrl}/link?userId=${ctx.from?.id}` } }
                    ]]
            }
        });
    }
    async onMessage(ctx) {
        if (ctx.message && 'text' in ctx.message) {
            this.logger.log(`Received message from ${ctx.from?.id}: ${ctx.message.text}`);
        }
    }
};
exports.TelegramUpdate = TelegramUpdate;
__decorate([
    (0, nestjs_telegraf_1.Start)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onStart", null);
__decorate([
    (0, nestjs_telegraf_1.On)('callback_query'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onMenuSelection", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('swap'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onSwap", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('link'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onLink", null);
__decorate([
    (0, nestjs_telegraf_1.On)('text'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onMessage", null);
exports.TelegramUpdate = TelegramUpdate = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    (0, common_1.UseGuards)(telegram_rate_limiter_guard_1.TelegramRateLimiterGuard),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], TelegramUpdate);
//# sourceMappingURL=telegram.update.js.map