import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as dns from 'node:dns';
import { TOKENS } from '../../common/constants/tokens';

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
    // V1 is the standard for 2026
    this.apiUrl = this.configService.get<string>('JUPITER_API_URL', 'https://api.jup.ag/swap/v1');
    this.apiKey = this.configService.getOrThrow<string>('JUPITER_API_KEY');
  }

  async getQuote(inputMint: string, outputMint: string, amountRaw: string, slippageBps: number = 50) {
    const isMainnet = this.configService.get<string>('SOLANA_CLUSTER') !== 'devnet';
    
    // Auto-resolve symbols to cluster-specific mints
    const resolvedInput = this.resolveMint(inputMint, isMainnet);
    const resolvedOutput = this.resolveMint(outputMint, isMainnet);

    const url = `${this.apiUrl}/quote`;
    const params = {
        inputMint: resolvedInput,
        outputMint: resolvedOutput,
        amount: amountRaw,
        slippageBps,
    };

    try {
      this.logger.log(`🔍 Jupiter Request (${isMainnet ? 'Mainnet' : 'Devnet'}): ${JSON.stringify(params)}`);
      
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

  private resolveMint(token: string, isMainnet: boolean): string {
      const trimmed = token.trim();
      if (trimmed === 'SOL' || trimmed.includes('So111')) return TOKENS.SOL;
      if (trimmed === 'USDC') return isMainnet ? TOKENS.USDC_MAINNET : TOKENS.USDC_DEVNET;
      if (trimmed === 'USDT') return isMainnet ? TOKENS.USDT_MAINNET : TOKENS.USDT_DEVNET;
      return trimmed;
  }
}
