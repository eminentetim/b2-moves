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
let SwapWizard = class SwapWizard {
    async step1(ctx) {
        await ctx.reply('Ghost Swap Mode Activated 👻\n\nWhat token would you like to sell? (e.g. SOL, USDC)');
        ctx.wizard.next();
    }
    async step2(ctx, msg) {
        ctx.wizard.state.inputToken = msg.text.toUpperCase();
        await ctx.reply(`Got it. What token would you like to receive in exchange for ${ctx.wizard.state.inputToken}?`);
        ctx.wizard.next();
    }
    async step3(ctx, msg) {
        ctx.wizard.state.outputToken = msg.text.toUpperCase();
        await ctx.reply(`Amount of ${ctx.wizard.state.inputToken} to swap:`);
        ctx.wizard.next();
    }
    async step4(ctx, msg) {
        const amount = parseFloat(msg.text);
        if (isNaN(amount)) {
            await ctx.reply('Please enter a valid number for the amount:');
            return;
        }
        const state = ctx.wizard.state;
        state.amount = amount;
        await ctx.reply(`🎯 Swap Summary:\n\n` +
            `Sell: ${state.amount} ${state.inputToken}\n` +
            `Receive: ${state.outputToken}\n` +
            `Privacy: Vanish Level 3 (Maximum)\n\n` +
            `To execute this trade, please sign the intent with your linked wallet:`, {
            reply_markup: {
                inline_keyboard: [[
                        { text: '✍️ Sign & Execute', url: `https://b2moves.io/sign?amount=${state.amount}&in=${state.inputToken}&out=${state.outputToken}` }
                    ]]
            }
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
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __param(1, (0, nestjs_telegraf_1.Message)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SwapWizard.prototype, "step2", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(3),
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __param(1, (0, nestjs_telegraf_1.Message)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
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
    (0, nestjs_telegraf_1.Wizard)('swap-wizard')
], SwapWizard);
//# sourceMappingURL=swap.wizard.js.map