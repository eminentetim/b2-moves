import { Scenes } from 'telegraf';
export declare class SwapWizard {
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
