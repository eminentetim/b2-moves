import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async notifyUser(telegramId: string, message: string, retries = 2): Promise<any> {
    try {
      this.logger.log(`Sending notification to user: ${telegramId}`);
      return await this.bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      if (retries > 0) {
        this.logger.warn(`Failed to notify user, retrying... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.notifyUser(telegramId, message, retries - 1);
      }
      this.logger.error(`Failed to notify user ${telegramId}: ${error.message}`);
    }
  }

  async updateStatus(chatId: string, messageId: number, message: string, retries = 2) {
    try {
      this.logger.log(`Updating message ${messageId} in chat ${chatId}`);
      await this.bot.telegram.editMessageText(chatId, messageId, undefined, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
        if (error.message.includes('message is not modified')) return;
        
        if (retries > 0) {
            this.logger.warn(`Failed to edit message, retrying... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.updateStatus(chatId, messageId, message, retries - 1);
        }
        this.logger.error(`Failed to edit message: ${error.message}`);
    }
  }

  getProgressBar(percent: number): string {
    const totalBlocks = 10;
    const filledBlocks = Math.round((percent / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return '🟩'.repeat(filledBlocks) + '⬜'.repeat(emptyBlocks) + ` ${percent}%`;
  }
}
