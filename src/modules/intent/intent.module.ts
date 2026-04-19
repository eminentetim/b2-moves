import { Module } from '@nestjs/common';
import { IntentService } from './intent.service';
import { IntentController } from './intent.controller';
import { IntentUtility } from './intent.utility';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

@Module({
  imports: [OrchestratorModule],
  providers: [IntentService, IntentUtility],
  controllers: [IntentController],
})
export class IntentModule {}
