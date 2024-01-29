import { Test } from '@nestjs/testing';
import { ChargeService } from './charge.service';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('ChargeService', () => {
  let service: ChargeService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<ChargeService>(ChargeService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
