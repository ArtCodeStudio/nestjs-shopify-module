import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('Orders Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: OrdersController = module.get<OrdersController>(OrdersController);
    expect(controller).toBeDefined();
  });
});
