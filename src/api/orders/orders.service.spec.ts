import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService],
    }).compile();
    service = module.get<OrdersService>(OrdersService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
