import { Test, TestingModule } from '@nestjs/testing';
import { SmartCollectionsController } from './smart-collections.controller';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('SmartCollections Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: SmartCollectionsController = module.get<SmartCollectionsController>(SmartCollectionsController);
    expect(controller).toBeDefined();
  });
});
