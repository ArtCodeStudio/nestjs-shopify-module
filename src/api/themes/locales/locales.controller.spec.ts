import { Test, TestingModule } from '@nestjs/testing';
import { LocalesController } from './locales.controller';

import { ShopifyModule } from '../../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../../test/config.test';
import * as passport from 'passport';

describe('Locales Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: LocalesController = module.get<LocalesController>(LocalesController);
    expect(controller).toBeDefined();
  });
});
