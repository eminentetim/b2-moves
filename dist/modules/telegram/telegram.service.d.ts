import { Telegraf, Context } from 'telegraf';
export declare class TelegramService {
    private readonly bot;
    private readonly logger;
    constructor(bot: Telegraf<Context>);
    notifyUser(telegramId: string, message: string, retries?: number): Promise<any>;
    updateStatus(chatId: string, messageId: number, message: string, retries?: number): any;
    getProgressBar(percent: number): string;
}
