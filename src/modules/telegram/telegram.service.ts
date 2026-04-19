import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async notifyUser(telegramId: string, message: string) {
    try {
      this.logger.log(`Sending notification to user: ${telegramId}`);
      await this.bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error(`Failed to notify user ${telegramId}: ${error.message}`);
    }
  }
}
