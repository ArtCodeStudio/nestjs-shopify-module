import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';

import { ShopifyModule } from '../../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../../test/config.test';
import * as passport from 'passport';

describe('Assets Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: AssetsController = module.get<AssetsController>(AssetsController);
    expect(controller).toBeDefined();
  });
});
