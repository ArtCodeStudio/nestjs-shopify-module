import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyAuthController } from './auth.controller';

describe('Auth Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ShopifyAuthController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ShopifyAuthController = module.get<ShopifyAuthController>(ShopifyAuthController);
    expect(controller).toBeDefined();
  });
});
