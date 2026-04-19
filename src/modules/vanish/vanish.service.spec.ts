import { Test, TestingModule } from '@nestjs/testing';
import { VanishService } from './vanish.service';

describe('VanishService', () => {
  let service: VanishService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VanishService],
    }).compile();

    service = module.get<VanishService>(VanishService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
