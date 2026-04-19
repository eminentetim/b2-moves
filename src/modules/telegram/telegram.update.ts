import { Update, Start, Help, On, Command } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';

@Update()
export class TelegramUpdate {
  @Start()
  async onStart(ctx: Context) {
    await ctx.reply(
      '🛸 Welcome to B2 Moves — Private Execution Protocol\n\n' +
      'Trade in silence. Move like a ghost. Leave only outcomes.\n\n' +
      'Available Commands:\n' +
      '/swap - Initiate a private swap\n' +
      '/status - Check current execution status\n' +
      '/help - Get detailed instructions',
    );
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
    await ctx.reply(
      '🔗 Link your Solana Wallet\n\n' +
      'To execute private trades, B2 Moves needs to verify your ownership of a Solana wallet.\n\n' +
      'Step 1: Click the button below to open the B2 Secure Linker.\n' +
      'Step 2: Connect your Phantom/Solflare wallet.\n' +
      'Step 3: Sign the one-time verification message.',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🌐 Connect Wallet', url: 'https://b2moves.io/verify?user=' + ctx.from?.id }
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
