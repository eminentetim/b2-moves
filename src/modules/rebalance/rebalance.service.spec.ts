import { Test, TestingModule } from '@nestjs/testing';
import { RebalanceService } from './rebalance.service';

describe('RebalanceService', () => {
  let service: RebalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RebalanceService],
    }).compile();

    service = module.get<RebalanceService>(RebalanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
