import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';

describe('Products Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ProductsController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ProductsController = module.get<ProductsController>(ProductsController);
    expect(controller).toBeDefined();
  });
});
