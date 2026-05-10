import { Scenes } from 'telegraf';
import { VanishService } from '../vanish/vanish.service';
import { PrismaService } from '../../database/prisma/prisma.service';
export declare class DepositWizard {
    private readonly vanishService;
    private readonly prisma;
    constructor(vanishService: VanishService, prisma: PrismaService);
    step1(ctx: Scenes.WizardContext): Promise<void>;
    step2(ctx: Scenes.WizardContext): Promise<void>;
}
