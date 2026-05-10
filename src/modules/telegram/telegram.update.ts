import { Update, Start, Help, On, Command } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { UseGuards, Logger } from '@nestjs/common';
import { TelegramRateLimiterGuard } from './telegram-rate-limiter.guard';
import { PrismaService } from '../../database/prisma/prisma.service';

@Update()
@UseGuards(TelegramRateLimiterGuard)
export class TelegramUpdate {
  private readonly logger = new Logger('TelegramBot');

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Start()
  async onStart(ctx: Scenes.SceneContext) {
    const telegramId = ctx.from?.id.toString();
    const user = await this.prisma.user.findUnique({ where: { telegramId } });

    if (!user || !user.solanaPublicKey) {
      await ctx.scene.enter('onboarding-wizard');
      return;
    }

    await ctx.reply(
      `Welcome back, Agent. 🛸\n\nYour stealth link is active. What move would you like to make?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📥 Private Deposit', callback_data: 'menu:deposit' }],
            [{ text: '🔀 Ghost Swap', callback_data: 'menu:swap' }],
            [{ text: '⚖️ Private Rebalance', callback_data: 'menu:rebalance' }],
            [{ text: '🎯 Limit Order', callback_data: 'menu:limit' }],
            [{ text: '🔁 DCA Strategy', callback_data: 'menu:dca' }],
            [{ text: '🛡️ My Positions', callback_data: 'menu:positions' }],
            [{ text: '👤 My Identity', callback_data: 'menu:identity' }]
          ]
        }
      }
    );
  }

  @On('callback_query')
  async onMenuSelection(ctx: Scenes.SceneContext) {
    const data = (ctx.callbackQuery as any).data;
    if (!data || !data.startsWith('menu:')) return;

    const action = data.split(':')[1];

    if (action === 'deposit') {
        await ctx.answerCbQuery();
        await ctx.scene.enter('deposit-wizard');
    } else if (action === 'swap') {
        await ctx.answerCbQuery();
        await ctx.scene.enter('swap-wizard');
    } else if (action === 'rebalance') {
        await ctx.answerCbQuery();
        await ctx.scene.enter('rebalance-wizard');
    } else if (action === 'limit') {
        await ctx.answerCbQuery();
        await ctx.scene.enter('limit-order-wizard');
    } else if (action === 'dca') {
        await ctx.answerCbQuery();
        await ctx.scene.enter('dca-wizard');
    } else if (action === 'positions') {
        await ctx.answerCbQuery();
        await ctx.scene.enter('positions-wizard');
    } else if (action === 'identity') {
        const user = await this.prisma.user.findUnique({ where: { telegramId: ctx.from?.id.toString() } });
        await ctx.answerCbQuery();
        await ctx.reply(`🛡️ *Identity Status*\n\nLinked Wallet: \`${user?.solanaPublicKey}\`\nStatus: Stealth Active`, { parse_mode: 'Markdown' });
    }
  }

  @Command('swap')
  async onSwap(ctx: Scenes.SceneContext) {
    await ctx.scene.enter('swap-wizard');
  }

  @Command('link')
  async onLink(ctx: Context) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    await ctx.reply(
      '🛸 *B2 Onboarding: Stealth Activation*\n\nTap the button to link your Solana identity.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🛡️ Activate Stealth Link', web_app: { url: `${frontendUrl}/link?userId=${ctx.from?.id}` } }
          ]]
        }
      }
    );
  }

  @On('text')
  async onMessage(ctx: Context) {
    if (ctx.message && 'text' in ctx.message) {
        this.logger.log(`Received message from ${ctx.from?.id}: ${ctx.message.text}`);
    }
  }
}
