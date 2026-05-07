import { Scenes } from 'telegraf';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class DcaWizard {
    private readonly prisma;
    private readonly configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    step1(ctx: Scenes.WizardContext): Promise<void>;
    step2(ctx: Scenes.WizardContext): Promise<void>;
    step3(ctx: Scenes.WizardContext): Promise<void>;
    step4(ctx: Scenes.WizardContext, msg: {
        text: string;
    }): Promise<void>;
    step5(ctx: Scenes.WizardContext): Promise<void>;
}
