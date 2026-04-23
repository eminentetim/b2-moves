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
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
let TelegramService = TelegramService_1 = class TelegramService {
    bot;
    logger = new common_1.Logger(TelegramService_1.name);
    constructor(bot) {
        this.bot = bot;
    }
    async notifyUser(telegramId, message) {
        try {
            this.logger.log(`Sending notification to user: ${telegramId}`);
            return await this.bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
        }
        catch (error) {
            this.logger.error(`Failed to notify user ${telegramId}: ${error.message}`);
        }
    }
    async updateStatus(chatId, messageId, message) {
        try {
            this.logger.log(`Updating message ${messageId} in chat ${chatId}`);
            await this.bot.telegram.editMessageText(chatId, messageId, undefined, message, {
                parse_mode: 'Markdown',
            });
        }
        catch (error) {
            if (error.message.includes('message is not modified'))
                return;
            this.logger.error(`Failed to edit message: ${error.message}`);
            await this.notifyUser(chatId, message);
        }
    }
    getProgressBar(percent) {
        const totalBlocks = 10;
        const filledBlocks = Math.round((percent / 100) * totalBlocks);
        const emptyBlocks = totalBlocks - filledBlocks;
        return '🟩'.repeat(filledBlocks) + '⬜'.repeat(emptyBlocks) + ` ${percent}%`;
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [telegraf_1.Telegraf])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map