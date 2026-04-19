"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerModule = void 0;
const common_1 = require("@nestjs/common");
const worker_processor_1 = require("./worker.processor");
const jupiter_module_1 = require("../jupiter/jupiter.module");
const vanish_module_1 = require("../vanish/vanish.module");
const telegram_module_1 = require("../telegram/telegram.module");
const rpc_module_1 = require("../rpc/rpc.module");
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [jupiter_module_1.JupiterModule, vanish_module_1.VanishModule, telegram_module_1.TelegramModule, rpc_module_1.RpcModule],
        providers: [worker_processor_1.WorkerProcessor],
    })
], WorkerModule);
//# sourceMappingURL=worker.module.js.map