import { Context, Scenes } from 'telegraf';
import { ConfigService } from '@nestjs/config';
export declare class TelegramUpdate {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    onStart(ctx: Scenes.SceneContext): Promise<void>;
    onHelp(ctx: Context): Promise<void>;
    onSwap(ctx: Scenes.SceneContext): Promise<void>;
    onLink(ctx: Context): Promise<void>;
    onMessage(ctx: Context): Promise<void>;
}
