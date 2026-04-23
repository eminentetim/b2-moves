import { Test, TestingModule } from '@nestjs/testing';
import { JupiterService } from './jupiter.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import * as dns from 'node:dns';

// Force IPv4 to avoid ENOTFOUND in specific environments
dns.setDefaultResultOrder('ipv4first');

describe('JupiterService (Integration)', () => {
  let service: JupiterService;

  // Extend timeout for network requests
  jest.setTimeout(20000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
      providers: [JupiterService],
    }).compile();

    service = module.get<JupiterService>(JupiterService);
  });

  it('should fetch a valid SOL -> USDC quote', async () => {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const USDC_MINT = 'EPjFW3F2Ubf2BeJU76vpUPeTMB37mA8obGUX6w8n3p1';
    const amount = 100000000; // 0.1 SOL

    const quote = await service.getQuote(SOL_MINT, USDC_MINT, amount);
    
    expect(quote).toBeDefined();
    expect(quote.inputMint).toBe(SOL_MINT);
    expect(quote.outputMint).toBe(USDC_MINT);
    expect(Number(quote.outAmount)).toBeGreaterThan(0);
    
    console.log('Jupiter Live Quote:', {
      in: quote.inAmount,
      out: quote.outAmount,
      priceImpact: quote.priceImpactPct
    });
  });
});
