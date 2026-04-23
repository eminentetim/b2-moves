import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IntentModule } from './modules/intent/intent.module';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module';
import { WorkerModule } from './modules/worker/worker.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { JupiterModule } from './modules/jupiter/jupiter.module';
import { VanishModule } from './modules/vanish/vanish.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { RpcModule } from './modules/rpc/rpc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', 'b2-signer', 'dist'),
      exclude: ['/intent/(.*)', '/status/(.*)'],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6379')),
        },
      }),
    }),
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
        middlewares: [session()],
        include: [TelegramModule],
      }),
    }),
    IntentModule,
    OrchestratorModule,
    WorkerModule,
    TelegramModule,
    JupiterModule,
    VanishModule,
    RpcModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        const logger = new Logger('HTTP');
        if (!req.url.includes('assets')) {
            logger.log(`${req.method} ${req.url}`);
        }
        next();
      })
      .forRoutes('*');
  }
}
