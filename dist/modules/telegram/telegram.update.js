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
let TelegramUpdate = class TelegramUpdate {
    async onStart(ctx) {
        await ctx.reply('🛸 Welcome to B2 Moves — Private Execution Protocol\n\n' +
            'Trade in silence. Move like a ghost. Leave only outcomes.\n\n' +
            'Available Commands:\n' +
            '/swap - Initiate a private swap\n' +
            '/status - Check current execution status\n' +
            '/help - Get detailed instructions');
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
        await ctx.reply('🔗 Link your Solana Wallet\n\n' +
            'To execute private trades, B2 Moves needs to verify your ownership of a Solana wallet.\n\n' +
            'Step 1: Click the button below to open the B2 Secure Linker.\n' +
            'Step 2: Connect your Phantom/Solflare wallet.\n' +
            'Step 3: Sign the one-time verification message.', {
            reply_markup: {
                inline_keyboard: [[
                        { text: '🌐 Connect Wallet', url: 'https://b2moves.io/verify?user=' + ctx.from?.id }
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
    __metadata("design:paramtypes", [telegraf_1.Context]),
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
    (0, nestjs_telegraf_1.Update)()
], TelegramUpdate);
//# sourceMappingURL=telegram.update.js.map