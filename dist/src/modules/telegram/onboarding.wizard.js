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
exports.OnboardingWizard = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma/prisma.service");
let OnboardingWizard = class OnboardingWizard {
    configService;
    prisma;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
    }
    async step1(ctx) {
        const user = await this.prisma.user.findUnique({
            where: { telegramId: ctx.from?.id.toString() }
        });
        if (user?.solanaPublicKey) {
            await ctx.reply(`Welcome back, Agent. Your stealth link is active for wallet: \`${user.solanaPublicKey}\`.\n\nUse /swap to initiate a move.`);
            return ctx.scene.leave();
        }
        await ctx.reply(`Hello. I am your B2 Stealth Agent. 🛸\n\n` +
            `I specialize in executing private moves on Solana—keeping your strategies and wallet history invisible to the public.\n\n` +
            `Ready to activate your stealth profile?`, {
            reply_markup: {
                inline_keyboard: [[{ text: "Let's Go", callback_data: 'next' }]]
            }
        });
        ctx.wizard.next();
    }
    async step2(ctx) {
        const frontendUrl = this.configService.get('FRONTEND_URL');
        await ctx.reply(`To trade in silence, I need to verify your Solana identity.\n\n` +
            `Tap the button to link your wallet. This is a one-time secure signature.`, {
            reply_markup: {
                inline_keyboard: [[
                        {
                            text: '🛡️ Securely Link Wallet',
                            web_app: { url: `${frontendUrl}/link?userId=${ctx.from?.id}` }
                        }
                    ]]
            }
        });
        return ctx.scene.leave();
    }
};
exports.OnboardingWizard = OnboardingWizard;
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(1),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnboardingWizard.prototype, "step1", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(2),
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnboardingWizard.prototype, "step2", null);
exports.OnboardingWizard = OnboardingWizard = __decorate([
    (0, nestjs_telegraf_1.Wizard)('onboarding-wizard'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], OnboardingWizard);
//# sourceMappingURL=onboarding.wizard.js.map