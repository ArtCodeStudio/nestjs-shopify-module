import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('SearchService', () => {
  let service: SearchService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
