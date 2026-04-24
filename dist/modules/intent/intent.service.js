"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var IntentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentService = void 0;
const common_1 = require("@nestjs/common");
const orchestrator_service_1 = require("../orchestrator/orchestrator.service");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const intent_utility_1 = require("./intent.utility");
const nacl = __importStar(require("tweetnacl"));
const bs58_1 = __importDefault(require("bs58"));
let IntentService = IntentService_1 = class IntentService {
    orchestratorService;
    prisma;
    utility;
    logger = new common_1.Logger(IntentService_1.name);
    constructor(orchestratorService, prisma, utility) {
        this.orchestratorService = orchestratorService;
        this.prisma = prisma;
        this.utility = utility;
    }
    async processIntent(createIntentDto) {
        this.logger.log(`Processing intent for user: ${createIntentDto.userId}`);
        const isValid = this.verifySignature(createIntentDto);
        if (!isValid) {
            this.logger.error(`Invalid signature for user: ${createIntentDto.userId}`);
            throw new common_1.UnauthorizedException('Invalid signature');
        }
        await this.prisma.user.upsert({
            where: { telegramId: createIntentDto.userId },
            update: { solanaPublicKey: createIntentDto.publicKey },
            create: {
                telegramId: createIntentDto.userId,
                solanaPublicKey: createIntentDto.publicKey,
            },
        });
        if (createIntentDto.action === 'LINK_WALLET') {
            await this.orchestratorService['telegramService'].notifyUser(createIntentDto.userId, `🛡️ *Stealth Activation Confirmed*\n\nYour identity is now linked to: \`${createIntentDto.publicKey}\`\n\nYou are ready to move in silence. Use /swap to begin.`);
            return {
                status: 'success',
                message: 'Wallet linked successfully',
            };
        }
        if (!createIntentDto.inputToken || !createIntentDto.outputToken || !createIntentDto.amount) {
            throw new Error('Missing swap details in intent');
        }
        const intent = await this.prisma.intent.create({
            data: {
                userId: createIntentDto.userId,
                inputToken: createIntentDto.inputToken,
                outputToken: createIntentDto.outputToken,
                amount: createIntentDto.amount,
                slippage: createIntentDto.slippage ?? 0.5,
                status: 'PENDING',
            },
        });
        await this.orchestratorService.addIntentToQueue({
            ...createIntentDto,
            intentId: intent.id
        });
        this.logger.log(`Intent ${intent.id} verified and enqueued for user: ${createIntentDto.userId}`);
        return {
            status: 'queued',
            intentId: intent.id,
            message: 'Intent verified and queued for execution',
            nonce: createIntentDto.nonce,
        };
    }
    verifySignature(dto) {
        try {
            const { signature, publicKey } = dto;
            const messageString = this.utility.createSignableMessage(dto);
            const messageUint8 = new TextEncoder().encode(messageString);
            const signatureUint8 = bs58_1.default.decode(signature);
            const publicKeyUint8 = bs58_1.default.decode(publicKey);
            return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
        }
        catch (error) {
            this.logger.error(`Error verifying signature: ${error.message}`);
            return false;
        }
    }
};
exports.IntentService = IntentService;
exports.IntentService = IntentService = IntentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [orchestrator_service_1.OrchestratorService,
        prisma_service_1.PrismaService,
        intent_utility_1.IntentUtility])
], IntentService);
//# sourceMappingURL=intent.service.js.map