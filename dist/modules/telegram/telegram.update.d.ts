import { Context, Scenes } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
export declare class TelegramUpdate {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    onStart(ctx: Scenes.SceneContext): Promise<void>;
    onMenuSelection(ctx: Scenes.SceneContext): Promise<void>;
    onSwap(ctx: Scenes.SceneContext): Promise<void>;
    onLink(ctx: Context): Promise<void>;
    onMessage(ctx: Context): Promise<void>;
}
