import { Wizard, WizardStep, Context, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { VanishService } from '../vanish/vanish.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TOKENS } from '../../common/constants/tokens';

@Wizard('deposit-wizard')
export class DepositWizard {
  constructor(
      private readonly vanishService: VanishService,
      private readonly prisma: PrismaService,
  ) {}

  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    await ctx.reply(
      '📥 *B2 Agent: Private Deposit*\n\n' +
      'To move in silence, you must first fund your **Vanish Stealth Profile**.\n\n' +
      'Which token would you like to deposit?',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'SOL', callback_data: 'deposit:SOL' }],
            [{ text: 'USDC', callback_data: 'deposit:USDC' }],
          ]
        }
      }
    );
    ctx.wizard.next();
  }

  @WizardStep(2)
  @On('callback_query')
  async step2(@Context() ctx: Scenes.WizardContext) {
    const data = (ctx.callbackQuery as any).data;
    
    // Safety check: Ensure we are processing a token selection, not the menu click
    if (!data || !data.startsWith('deposit:')) return;
    
    const token = data.split(':')[1];
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(`🛰️ *Generating Stealth Address for ${token}...*`, { parse_mode: 'Markdown' });

    try {
      const mint = token === 'SOL' ? TOKENS.SOL : TOKENS.USDC_MAINNET;
      const address = await this.vanishService.getDepositAddress(mint);
      
      const user = await this.prisma.user.findUnique({ 
          where: { telegramId: ctx.from?.id.toString() } 
      });

      await ctx.reply(
        `✅ *Your Private Deposit Addresses*\n\n` +
        `1️⃣ *Manual Ghost Swaps*\n` +
        `Address: \`${address}\`\n` +
        `_Funds sent here are linked to your Main Wallet._\n\n` +
        `2️⃣ *Automated DCA & Limit*\n` +
        `Address: \`${user?.agentPublicKey}\`\n` +
        `_Funds sent here enable autonomous moves without manual signing._\n\n` +
        `⚠️ *Instructions*:\n` +
        `• Only send ${token} on Solana Mainnet.\n` +
        `• For Automation, fund your **Agent Wallet** (#2).\n` +
        `• Once confirmed, your B2 Agent will move in silence.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: 'Done', callback_data: 'menu:start' }
            ]]
          }
        }
      );
    } catch (error) {
      await ctx.reply(`❌ Failed to generate address: ${error.message}`);
    }
    
    return ctx.scene.leave();
  }
}
