"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramRateLimiterGuard = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
let TelegramRateLimiterGuard = class TelegramRateLimiterGuard {
    rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
        points: 10,
        duration: 60,
    });
    async canActivate(context) {
        const ctx = nestjs_telegraf_1.TelegrafExecutionContext.create(context);
        const telegrafCtx = ctx.getContext();
        const userId = telegrafCtx.from?.id.toString();
        if (!userId)
            return true;
        try {
            await this.rateLimiter.consume(userId);
            return true;
        }
        catch (err) {
            await telegrafCtx.reply('⚠️ Slow down, Agent. You are moving too fast. Please wait a minute.');
            return false;
        }
    }
};
exports.TelegramRateLimiterGuard = TelegramRateLimiterGuard;
exports.TelegramRateLimiterGuard = TelegramRateLimiterGuard = __decorate([
    (0, common_1.Injectable)()
], TelegramRateLimiterGuard);
//# sourceMappingURL=telegram-rate-limiter.guard.js.map