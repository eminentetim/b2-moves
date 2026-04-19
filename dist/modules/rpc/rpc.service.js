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
var RpcService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const web3_js_1 = require("@solana/web3.js");
let RpcService = RpcService_1 = class RpcService {
    configService;
    logger = new common_1.Logger(RpcService_1.name);
    connection;
    backupConnection = null;
    commitment;
    constructor(configService) {
        this.configService = configService;
        this.commitment = this.configService.get('SOLANA_COMMITMENT') || 'confirmed';
    }
    onModuleInit() {
        const mainRpc = this.configService.get('SOLANA_HELIUS_RPC') ||
            this.configService.get('SOLANA_RPC_URL') ||
            'https://api.mainnet-beta.solana.com';
        const backupRpc = this.configService.get('SOLANA_QUICKNODE_RPC');
        this.connection = new web3_js_1.Connection(mainRpc, this.commitment);
        if (backupRpc) {
            this.backupConnection = new web3_js_1.Connection(backupRpc, this.commitment);
            this.logger.log(`RPC Initialized: Helius (Main), QuickNode (Backup)`);
        }
        else {
            this.logger.log(`RPC Initialized: ${mainRpc}`);
        }
    }
    getConnection() {
        return this.connection;
    }
    async getBalance(publicKey) {
        try {
            const balance = await this.connection.getBalance(new web3_js_1.PublicKey(publicKey));
            return balance / 10 ** 9;
        }
        catch (error) {
            this.logger.error(`Failed to get balance from primary RPC, retrying with backup...`);
            if (this.backupConnection) {
                const balance = await this.backupConnection.getBalance(new web3_js_1.PublicKey(publicKey));
                return balance / 10 ** 9;
            }
            throw error;
        }
    }
    async getLatestBlockhash() {
        return this.connection.getLatestBlockhash(this.commitment);
    }
    async simulateTransaction(transaction) {
        this.logger.log(`Simulating transaction...`);
        const simulation = await this.connection.simulateTransaction(transaction);
        if (simulation.value.err) {
            this.logger.error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
            throw new Error(`Transaction simulation failed`);
        }
        return simulation;
    }
    async confirmTransaction(signature) {
        this.logger.log(`Confirming transaction: ${signature}`);
        const latestBlockhash = await this.getLatestBlockhash();
        return this.connection.confirmTransaction({
            signature,
            ...latestBlockhash
        }, this.commitment);
    }
};
exports.RpcService = RpcService;
exports.RpcService = RpcService = RpcService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RpcService);
//# sourceMappingURL=rpc.service.js.map