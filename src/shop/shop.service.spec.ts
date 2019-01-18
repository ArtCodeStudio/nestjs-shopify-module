import { Test, TestingModule } from '@nestjs/testing';
import { ShopService } from './shop.service';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('ShopService', () => {
  let service: ShopService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<ShopService>(ShopService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
