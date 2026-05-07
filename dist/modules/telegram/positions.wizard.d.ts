import { Scenes } from 'telegraf';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RpcService } from '../rpc/rpc.service';
import { ConfigService } from '@nestjs/config';
export declare class PositionsWizard {
    private readonly prisma;
    private readonly rpcService;
    private readonly configService;
    constructor(prisma: PrismaService, rpcService: RpcService, configService: ConfigService);
    step1(ctx: Scenes.WizardContext): Promise<void>;
    step2(ctx: Scenes.WizardContext): Promise<void>;
    step3(ctx: Scenes.WizardContext): Promise<void>;
    step4(ctx: Scenes.WizardContext, msg: {
        text: string;
    }): Promise<void>;
    finish(ctx: Scenes.WizardContext): Promise<void>;
}
