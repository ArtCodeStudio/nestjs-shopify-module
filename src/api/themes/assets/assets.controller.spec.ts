import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';

describe('Assets Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [AssetsController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: AssetsController = module.get<AssetsController>(AssetsController);
    expect(controller).toBeDefined();
  });
});
