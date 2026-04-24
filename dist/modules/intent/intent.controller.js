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
var IntentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentController = void 0;
const common_1 = require("@nestjs/common");
const intent_service_1 = require("./intent.service");
const intent_utility_1 = require("./intent.utility");
const create_intent_dto_1 = require("./dto/create-intent.dto");
let IntentController = IntentController_1 = class IntentController {
    intentService;
    utility;
    logger = new common_1.Logger(IntentController_1.name);
    constructor(intentService, utility) {
        this.intentService = intentService;
        this.utility = utility;
    }
    async create(createIntentDto) {
        this.logger.log(`Received POST /intent for user ${createIntentDto.userId}`);
        return this.intentService.processIntent(createIntentDto);
    }
    async getMessage(query) {
        try {
            this.logger.log(`Received GET /intent/message. Query: ${JSON.stringify(query)}`);
            const timestamp = query.timestamp || Date.now().toString();
            const message = this.utility.createSignableMessage({
                ...query,
                timestamp,
            });
            this.logger.log(`Generated message: ${message}`);
            return {
                message: message,
                timestamp: timestamp,
            };
        }
        catch (error) {
            this.logger.error(`Internal Error: ${error.message}`);
            return {
                message: `Details: trade:error,${Date.now()}`,
                timestamp: Date.now().toString(),
                error: error.message
            };
        }
    }
};
exports.IntentController = IntentController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_intent_dto_1.CreateIntentDto]),
    __metadata("design:returntype", Promise)
], IntentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('message'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntentController.prototype, "getMessage", null);
exports.IntentController = IntentController = IntentController_1 = __decorate([
    (0, common_1.Controller)('intent'),
    __metadata("design:paramtypes", [intent_service_1.IntentService,
        intent_utility_1.IntentUtility])
], IntentController);
//# sourceMappingURL=intent.controller.js.map