import { Module } from '@nestjs/common';
import { WorkerProcessor } from './worker.processor';
import { JupiterModule } from '../jupiter/jupiter.module';
import { VanishModule } from '../vanish/vanish.module';
import { TelegramModule } from '../telegram/telegram.module';
import { RpcModule } from '../rpc/rpc.module';

@Module({
  imports: [JupiterModule, VanishModule, TelegramModule, RpcModule],
  providers: [WorkerProcessor],
})
export class WorkerModule {}
