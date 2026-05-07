import { Test, TestingModule } from '@nestjs/testing';
import { RebalanceController } from './rebalance.controller';

describe('RebalanceController', () => {
  let controller: RebalanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RebalanceController],
    }).compile();

    controller = module.get<RebalanceController>(RebalanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
