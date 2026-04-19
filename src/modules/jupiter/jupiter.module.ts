import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JupiterService } from './jupiter.service';

@Module({
  imports: [HttpModule],
  providers: [JupiterService],
  exports: [JupiterService],
})
export class JupiterModule {}
