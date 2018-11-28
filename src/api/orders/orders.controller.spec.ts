import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';

describe('Orders Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [OrdersController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: OrdersController = module.get<OrdersController>(OrdersController);
    expect(controller).toBeDefined();
  });
});
