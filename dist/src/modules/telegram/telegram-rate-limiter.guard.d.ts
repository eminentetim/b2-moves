import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class TelegramRateLimiterGuard implements CanActivate {
    private rateLimiter;
    canActivate(context: ExecutionContext): Promise<boolean>;
}
