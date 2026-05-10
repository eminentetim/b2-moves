import { Wizard, WizardStep, Context, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RpcService } from '../rpc/rpc.service';
import { ConfigService } from '@nestjs/config';
import { TOKENS } from '../../common/constants/tokens';

@Wizard('positions-wizard')
export class PositionsWizard {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rpcService: RpcService,
    private readonly configService: ConfigService,
  ) {}

  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    const user = await this.prisma.user.findUnique({ where: { telegramId: ctx.from?.id.toString() } });
    if (!user?.solanaPublicKey) {
      await ctx.reply('⚠️ Please link your wallet first using /link');
      return ctx.scene.leave();
    }

    const tokens = await this.rpcService.getTokensForWallet(user.solanaPublicKey);
    
    if (tokens.length === 0) {
        await ctx.reply('You have no active token positions.');
        return ctx.scene.leave();
    }

    const buttons = tokens.map(t => {
        const symbol = Object.keys(TOKENS).find(k => TOKENS[k as keyof typeof TOKENS] === t.mint) || t.mint.substring(0, 4);
        return [{ text: `${symbol}: ${t.amount.toFixed(2)}`, callback_data: `pos:${t.mint}:${symbol}:${t.amount}` }];
    });

    await ctx.reply(
      '🛡️ *Your Active Positions*\n\n' +
      'Select a token to manage its private exit strategy (TP/SL).',
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      }
    );
    ctx.wizard.next();
  }

  @WizardStep(2)
  @On('callback_query')
  async step2(@Context() ctx: Scenes.WizardContext) {
    const data = (ctx.callbackQuery as any).data;
    const [, mint, symbol, amount] = data.split(':');
    
    (ctx.wizard.state as any).mint = mint;
    (ctx.wizard.state as any).symbol = symbol;
    (ctx.wizard.state as any).amount = parseFloat(amount);

    await ctx.answerCbQuery();
    await ctx.reply(
      `🛡️ *Managing ${symbol}*\n\n` +
      `Current Balance: ${amount}\n\n` +
      `What would you like to set?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📈 Take Profit (USD)', callback_data: 'set:tp' }],
            [{ text: '📉 Stop Loss (USD)', callback_data: 'set:sl' }],
            [{ text: '🛡️ Set Both', callback_data: 'set:both' }],
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
    const mode = data.split(':')[1];
    (ctx.wizard.state as any).mode = mode;

    await ctx.answerCbQuery();
    if (mode === 'tp' || mode === 'both') {
        await ctx.reply(`Enter **Take Profit** price (USD):`);
    } else {
        await ctx.reply(`Enter **Stop Loss** price (USD):`);
    }
    ctx.wizard.next();
  }

  @WizardStep(4)
  @On('text')
  async step4(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    const val = parseFloat(msg.text);
    if (isNaN(val) || val <= 0) {
      await ctx.reply('Please enter a valid price:');
      return;
    }

    const state = ctx.wizard.state as any;
    if (state.mode === 'tp') {
        state.tp = val;
        return this.finish(ctx);
    } else if (state.mode === 'sl') {
        state.sl = val;
        return this.finish(ctx);
    } else if (state.mode === 'both') {
        if (!state.tp) {
            state.tp = val;
            await ctx.reply(`Enter **Stop Loss** price (USD):`);
            return;
        } else {
            state.sl = val;
            return this.finish(ctx);
        }
    }
  }

  async finish(ctx: Scenes.WizardContext) {
    const state = ctx.wizard.state as any;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const displaySymbol = state.symbol.replace(/_/g, '\\_');
    
    await ctx.reply(
      `🛡️ *Position Protection Summary*\n\n` +
      `Token: ${displaySymbol}\n` +
      `Take Profit: ${state.tp ? `$${state.tp}` : 'Not set'}\n` +
      `Stop Loss: ${state.sl ? `$${state.sl}` : 'Not set'}\n\n` +
      `_Authorize to sync these levels with the B2 Trigger Engine._`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '🛡️ Sync Protection', 
              web_app: { 
                url: `${frontendUrl}/?mode=tpsl&userId=${ctx.from?.id}&mint=${state.mint}&amount=${state.amount}&tp=${state.tp || ''}&sl=${state.sl || ''}` 
              } 
            }
          ]]
        }
      }
    );
    return ctx.scene.leave();
  }
}
