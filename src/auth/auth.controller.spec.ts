import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyAuthController } from './auth.controller';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('Auth Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ShopifyAuthController = module.get<ShopifyAuthController>(ShopifyAuthController);
    expect(controller).toBeDefined();
  });
});
