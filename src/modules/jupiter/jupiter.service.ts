import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as dns from 'node:dns';
import { TOKENS } from '../../common/constants/tokens';
import { Transaction, SystemProgram, PublicKey, Connection } from '@solana/web3.js';

@Injectable()
export class JupiterService {
  private readonly logger = new Logger(JupiterService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly connection: Connection;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    dns.setDefaultResultOrder('ipv4first');
    this.apiUrl = this.configService.get<string>('JUPITER_API_URL', 'https://api.jup.ag/swap/v1');
    this.apiKey = this.configService.getOrThrow<string>('JUPITER_API_KEY');
    this.connection = new Connection(this.configService.getOrThrow<string>('SOLANA_RPC_URL'));
  }

  async getPrices(mints: string[]): Promise<Record<string, number>> {
    const isDevnet = this.configService.get<string>('SOLANA_CLUSTER') === 'devnet';
    
    try {
      const ids = mints.join(',');
      const response = await firstValueFrom(
        this.httpService.get(`https://api.jup.ag/price/v3?ids=${ids}`, {
            headers: { 'x-api-key': this.apiKey }
        })
      );

      const prices: Record<string, number> = {};
      if (response.data) {
        for (const [id, info] of Object.entries(response.data)) {
            prices[id] = (info as any).usdPrice;
        }
      }

      // DEVNET FIX: If TARDIS or other tokens missing on Jupiter, return mock prices
      if (isDevnet) {
          mints.forEach(m => {
              if (!prices[m]) {
                  if (m === TOKENS.TARDIS) prices[m] = 1.0;
                  else if (m === TOKENS.SOL) prices[m] = 140.0;
                  else prices[m] = 1.0;
              }
          });
      }

      return prices;
    } catch (error) {
      this.logger.error(`Failed to fetch prices: ${error.message}`);
      if (isDevnet) {
          return mints.reduce((acc, m) => ({ ...acc, [m]: 1.0 }), {});
      }
      return {};
    }
  }

  async getQuote(inputMint: string, outputMint: string, amountRaw: string, slippageBps: number = 50) {
    const isDevnet = this.configService.get<string>('SOLANA_CLUSTER') === 'devnet';
    
    // Auto-resolve symbols to cluster-specific mints
    const resolvedInput = this.resolveMint(inputMint, !isDevnet);
    const resolvedOutput = this.resolveMint(outputMint, !isDevnet);

    // DEVNET BYPASS: If using TARDIS or on Devnet, return mock quote
    if (isDevnet && (resolvedInput === TOKENS.TARDIS || resolvedOutput === TOKENS.TARDIS)) {
        this.logger.log(`🛠️ Devnet Mock Quote for TARDIS: ${amountRaw}`);
        return {
            inputMint: resolvedInput,
            outputMint: resolvedOutput,
            inAmount: amountRaw,
            outAmount: amountRaw, // 1:1 for testing
            otherAmountThreshold: amountRaw,
            swapMode: 'ExactIn',
            slippageBps: slippageBps,
            priceImpactPct: '0',
            routePlan: [],
            contextSlot: 0,
            timeLambda: 0
        };
    }

    const url = `${this.apiUrl}/quote`;
    const params = {
        inputMint: resolvedInput,
        outputMint: resolvedOutput,
        amount: amountRaw,
        slippageBps,
    };

    try {
      this.logger.log(`🔍 Jupiter Request (${!isDevnet ? 'Mainnet' : 'Devnet'}): ${JSON.stringify(params)}`);
      
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
      
      if (isDevnet) {
          this.logger.warn('Falling back to Devnet Mock Quote due to Jupiter error');
          return {
              inputMint: resolvedInput,
              outputMint: resolvedOutput,
              inAmount: amountRaw,
              outAmount: amountRaw,
              slippageBps: slippageBps
          };
      }
      throw error;
    }
  }

  async getSwapTransaction(quoteResponse: any, userPublicKey: string) {
    const isDevnet = this.configService.get<string>('SOLANA_CLUSTER') === 'devnet';

    // DEVNET BYPASS: Build a dummy transaction for Vanish
    if (isDevnet) {
        this.logger.log(`🛠️ Building Devnet Mock Swap Transaction for ${userPublicKey}`);
        const transaction = new Transaction();
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(userPublicKey),
                toPubkey: new PublicKey(userPublicKey),
                lamports: 0, // Self-transfer 0 lamports as a dummy instruction
            })
        );
        
        transaction.feePayer = new PublicKey(userPublicKey);
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        // Serialize and return in the format Jupiter uses
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        });

        return {
            swapTransaction: serializedTransaction.toString('base64'),
            lastValidBlockHeight: 0 // Mocked
        };
    }

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
      if (trimmed === 'TARDIS') return TOKENS.TARDIS;
      return trimmed;
  }
}
