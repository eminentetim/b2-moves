import { Telegraf, Context } from 'telegraf';
export declare class TelegramService {
    private readonly bot;
    private readonly logger;
    constructor(bot: Telegraf<Context>);
    notifyUser(telegramId: string, message: string): Promise<void>;
}
