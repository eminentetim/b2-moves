import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class JupiterService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    constructor(httpService: HttpService, configService: ConfigService);
    getQuote(inputMint: string, outputMint: string, amountRaw: string, slippageBps?: number): Promise<any>;
    getSwapTransaction(quoteResponse: any, userPublicKey: string): Promise<any>;
    private resolveMint;
}
