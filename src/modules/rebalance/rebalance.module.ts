import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RebalanceService } from './rebalance.service';
import { RebalanceProcessor } from './rebalance.processor';
import { RpcModule } from '../rpc/rpc.module';
import { JupiterModule } from '../jupiter/jupiter.module';
import { TelegramModule } from '../telegram/telegram.module';
import { RebalanceController } from './rebalance.controller';

@Module({
  imports: [
    RpcModule,
    JupiterModule,
    TelegramModule,
    BullModule.registerQueue({
      name: 'rebalance',
    }),
  ],
  providers: [RebalanceService, RebalanceProcessor],
  controllers: [RebalanceController],
})
export class RebalanceModule {}
