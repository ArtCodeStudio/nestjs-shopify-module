import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesController } from './articles.controller';

import { ShopifyModule } from '../../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../../test/config.test';
import * as passport from 'passport';

describe('Articles Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ArticlesController = module.get<ArticlesController>(ArticlesController);
    expect(controller).toBeDefined();
  });
});
