import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class VanishService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    constructor(httpService: HttpService, configService: ConfigService);
    checkHealth(): Promise<any>;
    getOneTimeWallet(): Promise<any>;
    createTrade(payload: {
        user_address: string;
        source_token_address: string;
        target_token_address: string;
        amount: string;
        swap_transaction: string;
        one_time_wallet: string;
        user_signature: string;
        timestamp: string;
    }): Promise<any>;
    commitAction(tx_id: string): Promise<any>;
    generateVanishSignMessage(data: {
        user_address: string;
        source_token_address: string;
        target_token_address: string;
        amount: string;
        timestamp: string;
    }): string;
}
