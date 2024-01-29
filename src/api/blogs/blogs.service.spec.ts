import { Test } from '@nestjs/testing';
import { BlogsService } from './blogs.service';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('BlogsService', () => {
  let service: BlogsService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<BlogsService>(BlogsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
