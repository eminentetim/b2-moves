import { Wizard, WizardStep, Context, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Wizard('dca-wizard')
export class DcaWizard {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    await ctx.reply(
      '🔁 *B2 Agent: DCA Strategy Setup*\n\n' +
      'Which token do you want to **SELL** repeatedly?',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'USDC', callback_data: 'token:USDC' }],
            [{ text: 'SOL', callback_data: 'token:SOL' }],
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
    const token = data.split(':')[1];
    (ctx.wizard.state as any).fromToken = token;

    await ctx.answerCbQuery();
    await ctx.reply(
      `Which token do you want to **ACCUMULATE**?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'SOL', callback_data: 'token:SOL' }],
            [{ text: 'BONK', callback_data: 'token:BONK' }],
          ]
        }
      }
    );
    ctx.wizard.next();
  }

  @WizardStep(3)
  @On('callback_query')
  async step3(@Context() ctx: Scenes.WizardContext) {
    const data = (ctx.callbackQuery as any).data;
    const token = data.split(':')[1];
    (ctx.wizard.state as any).toToken = token;

    await ctx.answerCbQuery();
    await ctx.reply(`How much **${(ctx.wizard.state as any).fromToken}** per execution?`);
    ctx.wizard.next();
  }

  @WizardStep(4)
  @On('text')
  async step4(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    const amount = parseFloat(msg.text);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Please enter a valid amount:');
      return;
    }
    (ctx.wizard.state as any).amount = amount;

    await ctx.reply(
      `Select Frequency:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Daily', callback_data: 'freq:daily' }],
            [{ text: 'Weekly', callback_data: 'freq:weekly' }],
            [{ text: 'Monthly', callback_data: 'freq:monthly' }],
          ]
        }
      }
    );
    ctx.wizard.next();
  }

  @WizardStep(5)
  @On('callback_query')
  async step5(@Context() ctx: Scenes.WizardContext) {
    const data = (ctx.callbackQuery as any).data;
    const freq = data.split(':')[1];
    (ctx.wizard.state as any).frequency = freq;

    await ctx.answerCbQuery();
    const state = ctx.wizard.state as any;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    await ctx.reply(
      `🔁 *DCA Strategy Summary*\n\n` +
      `Sell: ${state.amount} ${state.fromToken.replace(/_/g, '\\_')}\n` +
      `Accumulate: ${state.toToken.replace(/_/g, '\\_')}\n` +
      `Frequency: ${state.frequency}\n\n` +
      `_Authorize the recurring intent to start the accumulation._`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '🛡️ Authorize DCA Move', 
              web_app: { 
                url: `${frontendUrl}/dca?userId=${ctx.from?.id}&from=${state.fromToken}&to=${state.toToken}&amount=${state.amount}&freq=${state.frequency}` 
              } 
            }
          ]]
        }
      }
    );
    return ctx.scene.leave();
  }
}
