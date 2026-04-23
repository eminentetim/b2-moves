import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class TelegramRateLimiterGuard implements CanActivate {
  private rateLimiter = new RateLimiterMemory({
    points: 10, // 10 points
    duration: 60, // per 60 seconds
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = TelegrafExecutionContext.create(context);
    const telegrafCtx = ctx.getContext();
    const userId = telegrafCtx.from?.id.toString();

    if (!userId) return true;

    try {
      await this.rateLimiter.consume(userId);
      return true;
    } catch (err) {
      await telegrafCtx.reply('⚠️ Slow down, Agent. You are moving too fast. Please wait a minute.');
      return false;
    }
  }
}
