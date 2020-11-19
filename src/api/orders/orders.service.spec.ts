import { Test } from '@nestjs/testing';
import { OrdersService } from './orders.service';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<OrdersService>(OrdersService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
