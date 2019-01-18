import { Test, TestingModule } from '@nestjs/testing';
import { LocalesService } from './locales.service';

import { ShopifyModule } from '../../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../../test/config.test';
import * as passport from 'passport';

describe('LocalesService', () => {
  let service: LocalesService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<LocalesService>(LocalesService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
