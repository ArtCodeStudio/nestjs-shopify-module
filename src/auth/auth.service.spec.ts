import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyAuthService } from './auth.service';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('ShopifyAuthService', () => {
  let module: TestingModule;
  let service: ShopifyAuthService;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<ShopifyAuthService>(ShopifyAuthService);

  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
