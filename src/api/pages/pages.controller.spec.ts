import { Test, TestingModule } from '@nestjs/testing';
import { PagesController } from './pages.controller';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('Pages Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: PagesController = module.get<PagesController>(PagesController);
    expect(controller).toBeDefined();
  });
});
