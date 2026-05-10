"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RebalanceModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const rebalance_service_1 = require("./rebalance.service");
const rebalance_processor_1 = require("./rebalance.processor");
const rpc_module_1 = require("../rpc/rpc.module");
const jupiter_module_1 = require("../jupiter/jupiter.module");
const telegram_module_1 = require("../telegram/telegram.module");
const rebalance_controller_1 = require("./rebalance.controller");
let RebalanceModule = class RebalanceModule {
};
exports.RebalanceModule = RebalanceModule;
exports.RebalanceModule = RebalanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            rpc_module_1.RpcModule,
            jupiter_module_1.JupiterModule,
            telegram_module_1.TelegramModule,
            bullmq_1.BullModule.registerQueue({
                name: 'rebalance',
            }),
        ],
        providers: [rebalance_service_1.RebalanceService, rebalance_processor_1.RebalanceProcessor],
        controllers: [rebalance_controller_1.RebalanceController],
    })
], RebalanceModule);
//# sourceMappingURL=rebalance.module.js.map