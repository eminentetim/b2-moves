import { Wizard, WizardStep, Context, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';

@Wizard('swap-wizard')
export class SwapWizard {
  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    await ctx.reply('Ghost Swap Mode Activated 👻\n\nWhat token would you like to sell? (e.g. SOL, USDC)');
    ctx.wizard.next();
  }

  @WizardStep(2)
  @On('text')
  async step2(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    (ctx.wizard.state as any).inputToken = msg.text.toUpperCase();
    await ctx.reply(`Got it. What token would you like to receive in exchange for ${(ctx.wizard.state as any).inputToken}?`);
    ctx.wizard.next();
  }

  @WizardStep(3)
  @On('text')
  async step3(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    (ctx.wizard.state as any).outputToken = msg.text.toUpperCase();
    await ctx.reply(`Amount of ${(ctx.wizard.state as any).inputToken} to swap:`);
    ctx.wizard.next();
  }

  @WizardStep(4)
  @On('text')
  async step4(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    const amount = parseFloat(msg.text);
    if (isNaN(amount)) {
      await ctx.reply('Please enter a valid number for the amount:');
      return;
    }
    
    const state = ctx.wizard.state as any;
    state.amount = amount;

    await ctx.reply(
      `🎯 Swap Summary:\n\n` +
      `Sell: ${state.amount} ${state.inputToken}\n` +
      `Receive: ${state.outputToken}\n` +
      `Privacy: Vanish Level 3 (Maximum)\n\n` +
      `To execute this trade, please sign the intent with your linked wallet:`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '✍️ Sign & Execute', url: `https://b2moves.io/sign?amount=${state.amount}&in=${state.inputToken}&out=${state.outputToken}` }
          ]]
        }
      }
    );
    
    return ctx.scene.leave();
  }
}
