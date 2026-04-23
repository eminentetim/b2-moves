import { Wizard, WizardStep, Context, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Wizard('swap-wizard')
export class SwapWizard {
  constructor(private readonly configService: ConfigService) {}

  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    await ctx.reply('Ghost Swap Mode Activated 👻\n\nWhat token would you like to sell? (e.g. SOL, USDC)');
    ctx.wizard.next();
  }

  @WizardStep(2)
  @On('text')
  async step2(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    if (msg.text.startsWith('/')) {
        await ctx.reply('Please enter a token name (e.g. SOL), not a command.');
        return;
    }
    (ctx.wizard.state as any).inputToken = msg.text.toUpperCase().trim();
    await ctx.reply(`Got it. What token would you like to receive in exchange for ${(ctx.wizard.state as any).inputToken}?`);
    ctx.wizard.next();
  }

  @WizardStep(3)
  @On('text')
  async step3(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    if (msg.text.startsWith('/')) {
        await ctx.reply('Please enter a token name (e.g. USDC), not a command.');
        return;
    }
    (ctx.wizard.state as any).outputToken = msg.text.toUpperCase().trim();
    await ctx.reply(`Amount of ${(ctx.wizard.state as any).inputToken} to swap:`);
    ctx.wizard.next();
  }

  @WizardStep(4)
  @On('text')
  async step4(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    const amount = parseFloat(msg.text);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Please enter a valid positive number for the amount:');
      return;
    }
    
    const state = ctx.wizard.state as any;
    state.amount = amount;

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    if (!frontendUrl || frontendUrl.includes('localhost')) {
        await ctx.reply('⚠️ Configuration Error: FRONTEND_URL in .env must be set to your local IP address (e.g., http://192.168.1.5:5173) for Telegram to accept the link.');
        return ctx.scene.leave();
    }

    const summaryMsg = await ctx.reply(
      `🎯 *Swap Summary*:\n\n` +
      `*Sell*: ${state.amount} ${state.inputToken}\n` +
      `*Receive*: ${state.outputToken}\n` +
      `*Privacy*: Vanish Level 3 (Maximum)\n\n` +
      `To execute this trade, please sign the intent with your linked wallet:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '✍️ Sign & Execute', 
              web_app: { url: `${frontendUrl}/sign?amount=${state.amount}&in=${state.inputToken}&out=${state.outputToken}&userId=${ctx.from?.id}&msgId=${0}` } // Placeholder
            }
          ]]
        }
      }
    );

    // We can't put the msgId in the same message we just sent if we need it for the URL.
    // However, in Telegram, we can update the markup AFTER sending.

    await ctx.telegram.editMessageReplyMarkup(
        ctx.chat?.id!,
        summaryMsg.message_id,
        undefined,
        {
            inline_keyboard: [[
                { 
                  text: '✍️ Sign & Execute Move', 
                  web_app: { url: `${frontendUrl}/sign?amount=${state.amount}&in=${state.inputToken}&out=${state.outputToken}&userId=${ctx.from?.id}&msgId=${summaryMsg.message_id}` } 
                }
            ]]
        }
    );

    
    return ctx.scene.leave();
  }
}
