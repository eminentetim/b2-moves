import { Controller, Get, Res, Req } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

@Controller()
export class AppController {
  @Get('health')
  checkHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Handle root
  @Get()
  getHome(@Res() res: express.Response) {
    return res.sendFile(join(process.cwd(), '..', 'b2-signer', 'dist', 'index.html'));
  }

  // Handle specific React routes
  @Get(['link', 'sign', 'rebalance'])
  handleAppRoutes(@Res() res: express.Response) {
    return res.sendFile(join(process.cwd(), '..', 'b2-signer', 'dist', 'index.html'));
  }
}
