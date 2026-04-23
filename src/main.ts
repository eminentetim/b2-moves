import * as dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Log validation errors explicitly
      exceptionFactory: (errors) => {
        logger.error(`Validation Failed: ${JSON.stringify(errors)}`);
        return errors;
      }
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\n🚀 B2 Moves Backend is LIVE on port ${port}`);
  console.log(`👉 Watch this terminal for logs when you click the button in Telegram.\n`);
}
bootstrap();
