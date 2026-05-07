import { Module } from '@nestjs/common';
import { IntentService } from './intent.service';
import { IntentController } from './intent.controller';
import { IntentUtility } from './intent.utility';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';
import { TradingModule } from '../trading/trading.module';

@Module({
  imports: [OrchestratorModule, PrismaModule, TelegramModule, TradingModule],
  providers: [IntentService, IntentUtility],
  controllers: [IntentController],
  exports: [IntentService],
})
export class IntentModule {}
