import { Controller, Get, Res, Req } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

@Controller()
export class AppController {
  // Handle the root path
  @Get()
  getHome(@Res() res: express.Response) {
    return res.sendFile(join(process.cwd(), '..', 'b2-signer', 'dist', 'index.html'));
  }

  // Handle known deep links specifically to avoid conflicts with assets
  @Get(['link', 'sign'])
  handleDeepLinks(@Res() res: express.Response) {
    return res.sendFile(join(process.cwd(), '..', 'b2-signer', 'dist', 'index.html'));
  }
}
