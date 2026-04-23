import { Update, Start, Help, On, Command } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { UseGuards } from '@nestjs/common';
import { TelegramRateLimiterGuard } from './telegram-rate-limiter.guard';

@Update()
@UseGuards(TelegramRateLimiterGuard)
export class TelegramUpdate {
  constructor(private readonly configService: ConfigService) {}

  @Start()
  async onStart(ctx: Scenes.SceneContext) {
    await ctx.scene.enter('onboarding-wizard');
  }

  @Help()
  async onHelp(ctx: Context) {
    await ctx.reply(
      'B2 Moves allows you to swap Solana tokens without linkability.\n\n' +
      'How it works:\n' +
      '1. Define your swap (/swap)\n' +
      '2. Sign the intent with your wallet\n' +
      '3. B2 Moves executes via Vanish + Jupiter\n' +
      '4. Receive tokens at a fresh, unlinked address.'
    );
  }

  @Command('swap')
  async onSwap(ctx: Scenes.SceneContext) {
    await ctx.scene.enter('swap-wizard');
  }

  @Command('link')
  async onLink(ctx: Context) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    await ctx.reply(
      '🛸 *B2 Onboarding: Stealth Activation*\n\n' +
      'To execute private intents, you must link your Solana identity.\n\n' +
      '1️⃣ Tap the button below.\n' +
      '2️⃣ Sign the one-time activation message.\n' +
      '3️⃣ Return here to start moving.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '🛡️ Activate Stealth Link', 
              web_app: { url: `${frontendUrl}/link?userId=${ctx.from?.id}` } 
            }
          ]]
        }
      }
    );
  }

  @On('text')
  async onMessage(ctx: Context) {
    // Basic catch-all for text messages
    if (ctx.message && 'text' in ctx.message) {
        // Handle conversational flow here
    }
  }
}
