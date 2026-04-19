import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class VanishService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    constructor(httpService: HttpService, configService: ConfigService);
    getPrivateRoute(inputToken: string, outputToken: string, amount: number): Promise<any>;
    executePrivateSwap(swapTransaction: any, privateRoute: any): Promise<any>;
}
