import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JupiterService {
  private readonly logger = new Logger(JupiterService.name);
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('JUPITER_API_URL', 'https://quote-api.jup.ag/v6');
  }

  async getQuote(inputMint: string, outputMint: string, amount: number, slippageBps: number = 50) {
    try {
      this.logger.log(`Fetching quote: ${amount} ${inputMint} -> ${outputMint}`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/quote`, {
          params: {
            inputMint,
            outputMint,
            amount,
            slippageBps,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch quote: ${error.message}`);
      throw error;
    }
  }

  async getSwapTransaction(quoteResponse: any, userPublicKey: string) {
    try {
      this.logger.log(`Requesting swap transaction for user: ${userPublicKey}`);
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/swap`, {
          quoteResponse,
          userPublicKey,
          wrapAndUnwrapSol: true,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get swap transaction: ${error.message}`);
      throw error;
    }
  }
}
