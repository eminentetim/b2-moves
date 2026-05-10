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
exports.LimitOrderWizard = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const config_1 = require("@nestjs/config");
let LimitOrderWizard = class LimitOrderWizard {
    prisma;
    configService;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async step1(ctx) {
        await ctx.reply('🎯 *B2 Agent: Limit Order Setup*\n\n' +
            'Which token do you want to **SELL**?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'SOL', callback_data: 'token:SOL' }],
                    [{ text: 'USDC', callback_data: 'token:USDC' }],
                ]
            }
        });
        ctx.wizard.next();
    }
    async step2(ctx) {
        const data = ctx.callbackQuery.data;
        const token = data.split(':')[1];
        ctx.wizard.state.inputToken = token;
        await ctx.answerCbQuery();
        await ctx.reply(`Which token do you want to **BUY**?`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'SOL', callback_data: 'token:SOL' }],
                    [{ text: 'USDC', callback_data: 'token:USDC' }],
                    [{ text: 'BONK', callback_data: 'token:BONK' }],
                ]
            }
        });
        ctx.wizard.next();
    }
    async step3(ctx) {
        const data = ctx.callbackQuery.data;
        const token = data.split(':')[1];
        ctx.wizard.state.outputToken = token;
        await ctx.answerCbQuery();
        await ctx.reply(`How much **${ctx.wizard.state.inputToken}** do you want to sell?`);
        ctx.wizard.next();
    }
    async step4(ctx, msg) {
        const amount = parseFloat(msg.text);
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('Please enter a valid amount:');
            return;
        }
        ctx.wizard.state.amount = amount;
        await ctx.reply(`At what **Target Price** (in USD) should the agent execute?`);
        ctx.wizard.next();
    }
    async step5(ctx, msg) {
        const price = parseFloat(msg.text);
        if (isNaN(price) || price <= 0) {
            await ctx.reply('Please enter a valid price:');
            return;
        }
        ctx.wizard.state.price = price;
        const state = ctx.wizard.state;
        const frontendUrl = this.configService.get('FRONTEND_URL');
        await ctx.reply(`🎯 *Limit Order Summary*\n\n` +
            `Sell: ${state.amount} ${state.inputToken.replace(/_/g, '\\_')}\n` +
            `Buy: ${state.outputToken.replace(/_/g, '\\_')}\n` +
            `Target Price: $${state.price}\n\n` +
            `_Authorize this intent to activate the shadow trigger._`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                        {
                            text: '🛡️ Authorize Limit Order',
                            web_app: {
                                url: `${frontendUrl}/limit?userId=${ctx.from?.id}&in=${state.inputToken}&out=${state.outputToken}&amount=${state.amount}&price=${state.price}`
                            }
                        }
                    ]]
            }
        });
        return ctx.scene.leave();
    }
};
exports.LimitOrderWizard = LimitOrderWizard;
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(1),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LimitOrderWizard.prototype, "step1", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(2),
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LimitOrderWizard.prototype, "step2", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(3),
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LimitOrderWizard.prototype, "step3", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(4),
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __param(1, (0, nestjs_telegraf_1.Message)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LimitOrderWizard.prototype, "step4", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(5),
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __param(1, (0, nestjs_telegraf_1.Message)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LimitOrderWizard.prototype, "step5", null);
exports.LimitOrderWizard = LimitOrderWizard = __decorate([
    (0, nestjs_telegraf_1.Wizard)('limit-order-wizard'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], LimitOrderWizard);
//# sourceMappingURL=limit-order.wizard.js.map