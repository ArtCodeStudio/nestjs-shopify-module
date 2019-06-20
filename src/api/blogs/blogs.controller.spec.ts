import { Test, TestingModule } from '@nestjs/testing';
import { BlogsController } from './blogs.controller';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('Blogs Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: BlogsController = module.get<BlogsController>(BlogsController);
    expect(controller).toBeDefined();
  });
});
