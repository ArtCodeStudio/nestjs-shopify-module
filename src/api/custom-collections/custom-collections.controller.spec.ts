import { Test, TestingModule } from '@nestjs/testing';
import { CustomCollectionsController } from './custom-collections.controller';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('CustomCollections Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: CustomCollectionsController = module.get<CustomCollectionsController>(CustomCollectionsController);
    expect(controller).toBeDefined();
  });
});
