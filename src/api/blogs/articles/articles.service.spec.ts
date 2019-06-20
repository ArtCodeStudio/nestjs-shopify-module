import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';

import { ShopifyModule } from '../../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../../test/config.test';
import * as passport from 'passport';

describe('ArticlesService', () => {
  let service: ArticlesService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<ArticlesService>(ArticlesService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
