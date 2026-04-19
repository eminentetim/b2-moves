import { Context, Scenes } from 'telegraf';
export declare class TelegramUpdate {
    onStart(ctx: Context): Promise<void>;
    onHelp(ctx: Context): Promise<void>;
    onSwap(ctx: Scenes.SceneContext): Promise<void>;
    onLink(ctx: Context): Promise<void>;
    onMessage(ctx: Context): Promise<void>;
}
