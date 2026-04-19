"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentModule = void 0;
const common_1 = require("@nestjs/common");
const intent_service_1 = require("./intent.service");
const intent_controller_1 = require("./intent.controller");
const intent_utility_1 = require("./intent.utility");
const orchestrator_module_1 = require("../orchestrator/orchestrator.module");
let IntentModule = class IntentModule {
};
exports.IntentModule = IntentModule;
exports.IntentModule = IntentModule = __decorate([
    (0, common_1.Module)({
        imports: [orchestrator_module_1.OrchestratorModule],
        providers: [intent_service_1.IntentService, intent_utility_1.IntentUtility],
        controllers: [intent_controller_1.IntentController],
    })
], IntentModule);
//# sourceMappingURL=intent.module.js.map