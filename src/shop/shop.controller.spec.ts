import { Test, TestingModule } from '@nestjs/testing';
import { ShopController } from './shop.controller';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('Shop Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ShopController = module.get<ShopController>(ShopController);
    expect(controller).toBeDefined();
  });
});
