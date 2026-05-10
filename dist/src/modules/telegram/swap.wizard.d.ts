import { Scenes } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RpcService } from '../rpc/rpc.service';
export declare class SwapWizard {
    private readonly configService;
    private readonly prisma;
    private readonly rpcService;
    constructor(configService: ConfigService, prisma: PrismaService, rpcService: RpcService);
    step1(ctx: Scenes.WizardContext): Promise<void>;
    step2(ctx: Scenes.WizardContext): Promise<void>;
    step3(ctx: Scenes.WizardContext): Promise<void>;
    step4(ctx: Scenes.WizardContext, msg: {
        text: string;
    }): Promise<void>;
}
