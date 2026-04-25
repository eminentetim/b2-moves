import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class VanishService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    private readonly LOAN_SOL;
    private readonly JITO_TIP;
    constructor(httpService: HttpService, configService: ConfigService);
    private getHeaders;
    checkHealth(): Promise<any>;
    getOneTimeWallet(): Promise<any>;
    createTrade(payload: any): Promise<any>;
    commitAction(tx_id: string): Promise<any>;
}
