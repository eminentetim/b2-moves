import { Telegraf, Context } from 'telegraf';
export declare class TelegramService {
    private readonly bot;
    private readonly logger;
    constructor(bot: Telegraf<Context>);
    notifyUser(telegramId: string, message: string): Promise<any>;
    updateStatus(chatId: string, messageId: number, message: string): Promise<void>;
    getProgressBar(percent: number): string;
}
