import * as dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // RAW EXPRESS LOGGER
  const server = app.getHttpAdapter().getInstance();
  server.use((req, res, next) => {
    if (!req.url.includes('assets') && !req.url.includes('.js') && !req.url.includes('.css')) {
        console.log(`[RAW HTTP] ${req.method} ${req.url}`);
    }
    next();
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`\n🛸 B2 MOVES: BACKEND ACTIVE`);
  console.log(`🚀 Server LIVE on port ${port}`);
}
bootstrap();
