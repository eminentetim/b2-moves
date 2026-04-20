import { Wizard, WizardStep, Context, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';

@Wizard('onboarding-wizard')
export class OnboardingWizard {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: ctx.from?.id.toString() }
    });

    if (user?.solanaPublicKey) {
        await ctx.reply(`Welcome back, Agent. Your stealth link is active for wallet: \`${user.solanaPublicKey}\`.\n\nUse /swap to initiate a move.`);
        return ctx.scene.leave();
    }

    await ctx.reply(
      `Hello. I am your B2 Stealth Agent. 🛸\n\n` +
      `I specialize in executing private moves on Solana—keeping your strategies and wallet history invisible to the public.\n\n` +
      `Ready to activate your stealth profile?`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Let's Go", callback_data: 'next' }]]
        }
      }
    );
    ctx.wizard.next();
  }

  @WizardStep(2)
  @On('callback_query')
  async step2(@Context() ctx: Scenes.WizardContext) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    await ctx.reply(
      `To trade in silence, I need to verify your Solana identity.\n\n` +
      `Tap the button to link your wallet. This is a one-time secure signature.`,
      {
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '🛡️ Securely Link Wallet', 
              web_app: { url: `${frontendUrl}/link?userId=${ctx.from?.id}` } 
            }
          ]]
        }
      }
    );
    return ctx.scene.leave();
  }
}
