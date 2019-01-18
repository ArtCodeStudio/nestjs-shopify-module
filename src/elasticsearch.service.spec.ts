import { Test, TestingModule } from '@nestjs/testing';
import { ElasticsearchService } from './elasticsearch.service';

import { ShopifyModule } from './shopify.module';
import { config, mongooseConnectionPromise } from '../test/config.test';
import * as passport from 'passport';

describe('ElasticsearchService', () => {
  let service: ElasticsearchService;
  beforeAll(async () => {
    const mongooseConnection = await mongooseConnectionPromise;
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, mongooseConnection, passport)],
    }).compile();
    service = module.get<ElasticsearchService>(ElasticsearchService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
