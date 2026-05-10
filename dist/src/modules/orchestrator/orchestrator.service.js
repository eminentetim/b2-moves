"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let OrchestratorService = OrchestratorService_1 = class OrchestratorService {
    executionQueue;
    rebalanceQueue;
    logger = new common_1.Logger(OrchestratorService_1.name);
    constructor(executionQueue, rebalanceQueue) {
        this.executionQueue = executionQueue;
        this.rebalanceQueue = rebalanceQueue;
    }
    async addIntentToQueue(intent, delay = 0) {
        this.logger.log(`Enqueuing intent for user: ${intent.userId} (Delay: ${delay}ms)`);
        const job = await this.executionQueue.add('execute-swap', intent, {
            attempts: 3,
            delay,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
        });
        this.logger.log(`Job added to execution queue with ID: ${job.id}`);
        return job;
    }
    async addRebalanceToQueue(rebalanceIntentId, telegramId, messageId) {
        this.logger.log(`Enqueuing rebalance intent: ${rebalanceIntentId} for user: ${telegramId}`);
        const job = await this.rebalanceQueue.add('plan-rebalance', {
            rebalanceIntentId,
            telegramId,
            messageId
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: true,
        });
        this.logger.log(`Job added to rebalance queue with ID: ${job.id}`);
        return job;
    }
};
exports.OrchestratorService = OrchestratorService;
exports.OrchestratorService = OrchestratorService = OrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('execution')),
    __param(1, (0, bullmq_1.InjectQueue)('rebalance')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        bullmq_2.Queue])
], OrchestratorService);
//# sourceMappingURL=orchestrator.service.js.map