import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JupiterService {
  private readonly logger = new Logger(JupiterService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('JUPITER_API_URL', 'https://quote-api.jup.ag/v6');
    this.apiKey = this.configService.getOrThrow<string>('JUPITER_API_KEY');
  }

  /**
   * Fetches an optimized swap quote from Jupiter V6.
   */
  async getQuote(inputMint: string, outputMint: string, amount: number, slippageBps: number = 50) {
    try {
      this.logger.log(`Jupiter: Fetching quote for ${amount} ${inputMint} -> ${outputMint}`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/quote`, {
          params: {
            inputMint,
            outputMint,
            amount: Math.floor(amount).toString(), // Ensure it's a string/integer
            slippageBps,
          },
          headers: {
            'x-api-key': this.apiKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Jupiter Quote failed: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  /**
   * Builds the unsigned swap transaction.
   */
  async getSwapTransaction(quoteResponse: any, userPublicKey: string) {
    try {
      this.logger.log(`Jupiter: Building swap transaction for ${userPublicKey}`);
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/swap`,
          {
            quoteResponse,
            userPublicKey,
            wrapAndUnwrapSol: true,
            // Optimization for private execution
            dynamicComputeUnitLimit: true,
            prioritizationFeeLamports: 'auto',
          },
          {
            headers: {
              'x-api-key': this.apiKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Jupiter Swap Build failed: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }
}
