import { Wizard, WizardStep, Context, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Wizard('limit-order-wizard')
export class LimitOrderWizard {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    await ctx.reply(
      '🎯 *B2 Agent: Limit Order Setup*\n\n' +
      'Which token do you want to **SELL**?',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'SOL', callback_data: 'token:SOL' }],
            [{ text: 'USDC', callback_data: 'token:USDC' }],
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
    (ctx.wizard.state as any).inputToken = token;

    await ctx.answerCbQuery();
    await ctx.reply(
      `Which token do you want to **BUY**?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'SOL', callback_data: 'token:SOL' }],
            [{ text: 'USDC', callback_data: 'token:USDC' }],
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
    (ctx.wizard.state as any).outputToken = token;

    await ctx.answerCbQuery();
    await ctx.reply(`How much **${(ctx.wizard.state as any).inputToken}** do you want to sell?`);
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

    await ctx.reply(`At what **Target Price** (in USD) should the agent execute?`);
    ctx.wizard.next();
  }

  @WizardStep(5)
  @On('text')
  async step5(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    const price = parseFloat(msg.text);
    if (isNaN(price) || price <= 0) {
      await ctx.reply('Please enter a valid price:');
      return;
    }
    (ctx.wizard.state as any).price = price;

    const state = ctx.wizard.state as any;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    await ctx.reply(
      `🎯 *Limit Order Summary*\n\n` +
      `Sell: ${state.amount} ${state.inputToken.replace(/_/g, '\\_')}\n` +
      `Buy: ${state.outputToken.replace(/_/g, '\\_')}\n` +
      `Target Price: $${state.price}\n\n` +
      `_Authorize this intent to activate the shadow trigger._`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '🛡️ Authorize Limit Order', 
              web_app: { 
                url: `${frontendUrl}/limit?userId=${ctx.from?.id}&in=${state.inputToken}&out=${state.outputToken}&amount=${state.amount}&price=${state.price}` 
              } 
            }
          ]]
        }
      }
    );
    return ctx.scene.leave();
  }
}
