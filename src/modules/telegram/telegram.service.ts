import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async notifyUser(telegramId: string, message: string): Promise<any> {
    try {
      this.logger.log(`Sending notification to user: ${telegramId}`);
      return await this.bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error(`Failed to notify user ${telegramId}: ${error.message}`);
    }
  }

  async updateStatus(chatId: string, messageId: number, message: string) {
    try {
      this.logger.log(`Updating message ${messageId} in chat ${chatId}`);
      await this.bot.telegram.editMessageText(chatId, messageId, undefined, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
        // Fallback to sending a new message if editing fails (e.g. message too old)
        if (error.message.includes('message is not modified')) return;
        this.logger.error(`Failed to edit message: ${error.message}`);
        await this.notifyUser(chatId, message);
    }
  }

  /**
   * Helper to generate a visual progress bar
   */
  getProgressBar(percent: number): string {
    const totalBlocks = 10;
    const filledBlocks = Math.round((percent / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return '🟩'.repeat(filledBlocks) + '⬜'.repeat(emptyBlocks) + ` ${percent}%`;
  }
}
