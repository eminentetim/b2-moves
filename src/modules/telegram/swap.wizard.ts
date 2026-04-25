import { Wizard, WizardStep, Context, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RpcService } from '../rpc/rpc.service';
import { TOKENS } from '../../common/constants/tokens';

@Wizard('swap-wizard')
export class SwapWizard {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly rpcService: RpcService,
  ) {}

  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    const telegramId = ctx.from?.id.toString();
    const user = await this.prisma.user.findUnique({ where: { telegramId } });

    if (!user || !user.solanaPublicKey) {
      await ctx.reply('⚠️ Wallet not linked. Please use /link first to activate your stealth profile.');
      return ctx.scene.leave();
    }

    await ctx.reply('🔍 Scanning your stealth wallet for assets...');

    const solBalance = await this.rpcService.getBalance(user.solanaPublicKey);
    const tokens = await this.rpcService.getTokensForWallet(user.solanaPublicKey);

    const buttons: any[][] = [];
    
    if (solBalance > 0) {
        buttons.push([{ text: `SOL (${solBalance.toFixed(3)})`, callback_data: `select:SOL:${TOKENS.SOL}` }]);
    }

    const knownMints: Record<string, string> = {
        [TOKENS.USDC_DEVNET]: 'USDC',
        [TOKENS.USDT_DEVNET]: 'USDT',
        [TOKENS.USDC_MAINNET]: 'USDC',
    };

    tokens.forEach(t => {
        const symbol = knownMints[t.mint] || t.mint.substring(0, 4) + '...';
        buttons.push([{ text: `${symbol} (${t.amount.toFixed(2)})`, callback_data: `select:${symbol}:${t.mint}` }]);
    });

    if (buttons.length === 0) {
        await ctx.reply('👻 Your wallet is empty. Deposit some funds to start moving.');
        return ctx.scene.leave();
    }

    await ctx.reply('Ghost Swap Mode Activated 👻\n\nWhich token would you like to sell?', {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
    ctx.wizard.next();
  }

  @WizardStep(2)
  @On('callback_query')
  async step2(@Context() ctx: Scenes.WizardContext) {
    const data = (ctx.callbackQuery as any).data;
    if (!data || !data.startsWith('select:')) return;

    const [, symbol, mint] = data.split(':');
    (ctx.wizard.state as any).inputToken = symbol;
    (ctx.wizard.state as any).inputMint = mint;

    await ctx.editMessageText(`Selected: *${symbol}*\n\nNow, what token would you like to receive?`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'USDC', callback_data: `target:USDC:${TOKENS.USDC_DEVNET}` }],
                [{ text: 'SOL', callback_data: `target:SOL:${TOKENS.SOL}` }],
            ]
        }
    });
    ctx.wizard.next();
  }

  @WizardStep(3)
  @On('callback_query')
  async step3(@Context() ctx: Scenes.WizardContext) {
    const data = (ctx.callbackQuery as any).data;
    if (!data || !data.startsWith('target:')) return;

    const [, symbol, mint] = data.split(':');
    (ctx.wizard.state as any).outputToken = symbol;
    (ctx.wizard.state as any).outputMint = mint;

    await ctx.editMessageText(`Input: *${(ctx.wizard.state as any).inputToken}*\nOutput: *${symbol}*\n\nHow much ${(ctx.wizard.state as any).inputToken} do you want to swap?`, {
        parse_mode: 'Markdown'
    });
    ctx.wizard.next();
  }

  @WizardStep(4)
  @On('text')
  async step4(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    const amount = parseFloat(msg.text);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Please enter a valid positive number:');
      return;
    }
    
    const state = ctx.wizard.state as any;
    state.amount = amount;
    
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const summaryMsg = await ctx.reply(
      `🎯 *Swap Summary*:\n\n` +
      `*Sell*: ${state.amount} ${state.inputToken}\n` +
      `*Receive*: ${state.outputToken}\n` +
      `*Privacy*: Vanish Level 3 (Maximum)\n\n` +
      `To execute this trade, please sign the intent:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '✍️ Sign & Execute Move', 
              web_app: { url: `${frontendUrl}/sign?amount=${state.amount}&in=${state.inputToken}&out=${state.outputToken}&userId=${ctx.from?.id}&msgId=${0}` } 
            }
          ]]
        }
      }
    );

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
