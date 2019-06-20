import { Test, TestingModule } from '@nestjs/testing';
import { CollectsController } from './collects.controller';

describe('Collects Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [CollectsController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: CollectsController = module.get<CollectsController>(CollectsController);
    expect(controller).toBeDefined();
  });
});
