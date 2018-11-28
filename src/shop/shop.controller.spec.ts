import { Test, TestingModule } from '@nestjs/testing';
import { ShopController } from './shop.controller';

describe('Shop Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ShopController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ShopController = module.get<ShopController>(ShopController);
    expect(controller).toBeDefined();
  });
});
