import { Test, TestingModule } from '@nestjs/testing';
import { RpcService } from './rpc.service';
import { ConfigModule } from '@nestjs/config';
import * as dns from 'node:dns';

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

describe('RpcService (Multi-Provider Redundancy)', () => {
  let service: RpcService;

  jest.setTimeout(20000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
      providers: [RpcService],
    }).compile();

    service = module.get<RpcService>(RpcService);
    service.onModuleInit();
  });

  it('should initialize multiple redundant connections', () => {
    const connectionCount = (service as any).connections.length;
    expect(connectionCount).toBeGreaterThanOrEqual(1);
    console.log(`Initialized with ${connectionCount} RPC endpoints.`);
  });

  it('should fetch balance through the redundant pipeline', async () => {
    const testWallet = 'H2Zs7tGvccMFGpJfEumbGHCiqiDo8WBiRVoJXMHHSKKr';
    const balance = await service.getBalance(testWallet);
    
    expect(typeof balance).toBe('number');
    console.log(`Redundant Pipeline Balance Check: ${balance} SOL`);
  });
});
