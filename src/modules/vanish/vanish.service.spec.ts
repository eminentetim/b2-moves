import { Test, TestingModule } from '@nestjs/testing';
import { VanishService } from './vanish.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

describe('VanishService (Integration)', () => {
  let service: VanishService;

  jest.setTimeout(15000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
      providers: [VanishService],
    }).compile();

    service = module.get<VanishService>(VanishService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should pass health check with live API', async () => {
    const health = await service.checkHealth();
    expect(health.status).toBe('healthy');
    console.log('Vanish Health Check Passed:', health);
  });
});
