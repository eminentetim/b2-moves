import { Wizard, WizardStep, Context, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RpcService } from '../rpc/rpc.service';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { TOKENS } from '../../common/constants/tokens';

@Wizard('rebalance-wizard')
export class RebalanceWizard {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rpcService: RpcService,
    private readonly orchestratorService: OrchestratorService,
  ) {}

  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    const user = await this.prisma.user.findUnique({ where: { telegramId: ctx.from?.id.toString() } });
    if (!user?.solanaPublicKey) {
      await ctx.reply('⚠️ Please link your wallet first using /link');
      return ctx.scene.leave();
    }

    await ctx.reply('🔍 *B2 Agent: Scanning Assets...*', { parse_mode: 'Markdown' });
    
    const solBalance = await this.rpcService.getBalance(user.solanaPublicKey);
    const tokens = await this.rpcService.getTokensForWallet(user.solanaPublicKey);

    const buttons: any[][] = [];
    if (solBalance > 0) {
        buttons.push([{ text: `SOL (${solBalance.toFixed(2)})`, callback_data: `add:SOL` }]);
    }
    
    const knownMints: Record<string, string> = {
        [TOKENS.TARDIS]: 'TARDIS',
        [TOKENS.USDC_MAINNET]: 'USDC',
    };

    tokens.forEach(t => {
        const symbol = knownMints[t.mint] || t.mint.substring(0, 4);
        buttons.push([{ text: `${symbol} (${t.amount.toFixed(2)})`, callback_data: `add:${symbol}` }]);
    });

    (ctx.wizard.state as any).targets = {};

    await ctx.reply(
      '⚖️ *Private Rebalancer*\n\n' +
      'Select the tokens you want to include in your **Target Portfolio**.\n\n' +
      '_The agent will sell overweight assets and buy underweight ones privately._',
      {
        parse_mode: 'Markdown',
        reply_markup: { 
          inline_keyboard: [...buttons, [{ text: '✅ Finish Selection', callback_data: 'done' }]] 
        }
      }
    );
    ctx.wizard.next();
  }

  @WizardStep(2)
  @On('callback_query')
  async step2(@Context() ctx: Scenes.WizardContext) {
    const data = (ctx.callbackQuery as any).data;
    const state = ctx.wizard.state as any;

    if (data === 'done') {
        const targets = Object.keys(state.targets);
        if (targets.length === 0) {
            await ctx.answerCbQuery('Select at least one token.', { show_alert: true });
            return;
        }
        state.currentIdx = 0;
        await ctx.reply(`🎯 Target Allocation for *${targets[0]}* (%):`, { parse_mode: 'Markdown' });
        ctx.wizard.next();
        return;
    }

    const symbol = data.split(':')[1];
    state.targets[symbol] = 0;
    await ctx.answerCbQuery(`Added ${symbol}`);
  }

  @WizardStep(3)
  @On('text')
  async step3(@Context() ctx: Scenes.WizardContext, @Message() msg: { text: string }) {
    const weight = parseFloat(msg.text);
    const state = ctx.wizard.state as any;
    const symbols = Object.keys(state.targets);
    
    if (isNaN(weight) || weight < 0 || weight > 100) {
        await ctx.reply('Please enter a number between 0 and 100:');
        return;
    }

    state.targets[symbols[state.currentIdx]] = weight;
    state.currentIdx++;

    if (state.currentIdx < symbols.length) {
        await ctx.reply(`🎯 Target Allocation for *${symbols[state.currentIdx]}* (%):`, { parse_mode: 'Markdown' });
    } else {
        const total = Object.values(state.targets).reduce((a: any, b: any) => a + b, 0) as number;
        if (Math.abs(total - 100) > 0.1) {
            await ctx.reply(`❌ Error: Weights total ${total}%. They must sum to **100%**.\n\nRestarting selection...`);
            return ctx.scene.reenter();
        }

        const summary = Object.entries(state.targets).map(([k,v]) => `• ${k}: ${v}%`).join('\n');
        const processingMsg = await ctx.reply(
            `🚀 *Move Authorized*\n\n` +
            `Target Portfolio:\n${summary}\n\n` +
            `_Orchestrating stealth trades via Vanish + Jupiter..._`,
            { parse_mode: 'Markdown' }
        );

        const intent = await this.prisma.rebalanceIntent.create({
            data: {
              userId: ctx.from?.id.toString()!,
              targetWeights: JSON.stringify(state.targets),
              slippage: 0.5,
              status: 'PENDING',
              messageId: processingMsg.message_id
            }
        });

        await this.orchestratorService.addRebalanceToQueue(intent.id, ctx.from?.id.toString()!, processingMsg.message_id);
        return ctx.scene.leave();
    }
  }
}
