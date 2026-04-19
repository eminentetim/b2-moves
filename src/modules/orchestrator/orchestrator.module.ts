import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrchestratorService } from './orchestrator.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'execution',
    }),
  ],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
