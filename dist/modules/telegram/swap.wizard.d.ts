import { Scenes } from 'telegraf';
import { ConfigService } from '@nestjs/config';
export declare class SwapWizard {
    private readonly configService;
    constructor(configService: ConfigService);
    step1(ctx: Scenes.WizardContext): Promise<void>;
    step2(ctx: Scenes.WizardContext, msg: {
        text: string;
    }): Promise<void>;
    step3(ctx: Scenes.WizardContext, msg: {
        text: string;
    }): Promise<void>;
    step4(ctx: Scenes.WizardContext, msg: {
        text: string;
    }): Promise<void>;
}
