import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';

import { ShopifyModule } from '../../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../../test/config.test';
import * as passport from 'passport';

describe('AssetsService', () => {
  let service: AssetsService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<AssetsService>(AssetsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
