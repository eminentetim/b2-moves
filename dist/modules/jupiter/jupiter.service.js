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
var JupiterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JupiterService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const dns = __importStar(require("node:dns"));
let JupiterService = JupiterService_1 = class JupiterService {
    httpService;
    configService;
    logger = new common_1.Logger(JupiterService_1.name);
    apiUrl;
    apiKey;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        dns.setDefaultResultOrder('ipv4first');
        this.apiUrl = this.configService.get('JUPITER_API_URL', 'https://preprod-quote-api.jup.ag');
        this.apiKey = this.configService.getOrThrow('JUPITER_API_KEY');
    }
    async getQuote(inputMint, outputMint, amountRaw, slippageBps = 50) {
        const url = `${this.apiUrl}/quote`;
        const cleanInput = inputMint.toString().trim();
        const cleanOutput = outputMint.toString().trim();
        const cleanAmount = amountRaw.toString().trim();
        const params = {
            inputMint: cleanInput,
            outputMint: cleanOutput,
            amount: cleanAmount,
            slippageBps,
        };
        try {
            this.logger.log(`🔍 Jupiter Devnet Request: ${cleanInput.substring(0, 8)}... -> ${cleanOutput.substring(0, 8)}... (${cleanAmount})`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                params,
                headers: { 'x-api-key': this.apiKey },
            }));
            return response.data;
        }
        catch (error) {
            if (error.response) {
                this.logger.error(`❌ Jupiter Error [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
    async getSwapTransaction(quoteResponse, userPublicKey) {
        try {
            this.logger.log(`Jupiter: Building swap transaction for ${userPublicKey}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/swap`, {
                quoteResponse,
                userPublicKey,
                wrapAndUnwrapSol: true,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: 'auto',
            }, {
                headers: { 'x-api-key': this.apiKey },
            }));
            return response.data;
        }
        catch (error) {
            if (error.response) {
                this.logger.error(`❌ Jupiter Swap Error: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
};
exports.JupiterService = JupiterService;
exports.JupiterService = JupiterService = JupiterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], JupiterService);
//# sourceMappingURL=jupiter.service.js.map