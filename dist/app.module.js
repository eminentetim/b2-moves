"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const intent_module_1 = require("./modules/intent/intent.module");
const orchestrator_module_1 = require("./modules/orchestrator/orchestrator.module");
const worker_module_1 = require("./modules/worker/worker.module");
const telegram_module_1 = require("./modules/telegram/telegram.module");
const jupiter_module_1 = require("./modules/jupiter/jupiter.module");
const vanish_module_1 = require("./modules/vanish/vanish.module");
const prisma_module_1 = require("./database/prisma/prisma.module");
const rpc_module_1 = require("./modules/rpc/rpc.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply((req, res, next) => {
            const logger = new common_1.Logger('HTTP');
            if (!req.url.includes('.')) {
                logger.log(`[${req.method}] ${req.url}`);
            }
            next();
        })
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), '..', 'b2-signer', 'dist'),
                exclude: ['/intent*'],
            }),
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    connection: {
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: parseInt(configService.get('REDIS_PORT', '6379')),
                    },
                }),
            }),
            nestjs_telegraf_1.TelegrafModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    token: configService.getOrThrow('TELEGRAM_BOT_TOKEN'),
                    middlewares: [(0, telegraf_1.session)()],
                    include: [telegram_module_1.TelegramModule],
                }),
            }),
            intent_module_1.IntentModule,
            orchestrator_module_1.OrchestratorModule,
            worker_module_1.WorkerModule,
            telegram_module_1.TelegramModule,
            jupiter_module_1.JupiterModule,
            vanish_module_1.VanishModule,
            rpc_module_1.RpcModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map