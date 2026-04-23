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
let TelegramUpdate = class TelegramUpdate {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    async onStart(ctx) {
        await ctx.scene.enter('onboarding-wizard');
    }
    async onHelp(ctx) {
        await ctx.reply('B2 Moves allows you to swap Solana tokens without linkability.\n\n' +
            'How it works:\n' +
            '1. Define your swap (/swap)\n' +
            '2. Sign the intent with your wallet\n' +
            '3. B2 Moves executes via Vanish + Jupiter\n' +
            '4. Receive tokens at a fresh, unlinked address.');
    }
    async onSwap(ctx) {
        await ctx.scene.enter('swap-wizard');
    }
    async onLink(ctx) {
        const frontendUrl = this.configService.get('FRONTEND_URL');
        await ctx.reply('🛸 *B2 Onboarding: Stealth Activation*\n\n' +
            'To execute private intents, you must link your Solana identity.\n\n' +
            '1️⃣ Tap the button below.\n' +
            '2️⃣ Sign the one-time activation message.\n' +
            '3️⃣ Return here to start moving.', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                        {
                            text: '🛡️ Activate Stealth Link',
                            web_app: { url: `${frontendUrl}/link?userId=${ctx.from?.id}` }
                        }
                    ]]
            }
        });
    }
    async onMessage(ctx) {
        if (ctx.message && 'text' in ctx.message) {
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
    (0, nestjs_telegraf_1.Help)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onHelp", null);
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
    __metadata("design:paramtypes", [config_1.ConfigService])
], TelegramUpdate);
//# sourceMappingURL=telegram.update.js.map