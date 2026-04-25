import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as dns from 'node:dns';

@Injectable()
export class JupiterService {
  private readonly logger = new Logger(JupiterService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    dns.setDefaultResultOrder('ipv4first');
    this.apiUrl = this.configService.get<string>('JUPITER_API_URL', 'https://preprod-quote-api.jup.ag');
    this.apiKey = this.configService.getOrThrow<string>('JUPITER_API_KEY');
  }

  async getQuote(inputMint: string, outputMint: string, amountRaw: string, slippageBps: number = 50) {
    // DEVNET FIX: Preprod uses /quote directly
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
      
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params,
          headers: { 'x-api-key': this.apiKey },
        }),
      );

      return response.data;
    } catch (error) {
      if (error.response) {
          this.logger.error(`❌ Jupiter Error [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async getSwapTransaction(quoteResponse: any, userPublicKey: string) {
    try {
      this.logger.log(`Jupiter: Building swap transaction for ${userPublicKey}`);
      
      // DEVNET FIX: Preprod uses /swap directly
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/swap`,
          {
            quoteResponse,
            userPublicKey,
            wrapAndUnwrapSol: true,
            dynamicComputeUnitLimit: true,
            prioritizationFeeLamports: 'auto',
          },
          {
            headers: { 'x-api-key': this.apiKey },
          },
        ),
      );

      return response.data;
    } catch (error) {
      if (error.response) {
          this.logger.error(`❌ Jupiter Swap Error: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
}
