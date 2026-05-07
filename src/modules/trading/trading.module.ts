import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { TradingProcessor } from './trading.processor';
import { JupiterModule } from '../jupiter/jupiter.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { PrismaModule } from '../../database/prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    JupiterModule,
    OrchestratorModule,
  ],
  controllers: [TradingController],
  providers: [TradingService, TradingProcessor],
  exports: [TradingService],
})
export class TradingModule {}
