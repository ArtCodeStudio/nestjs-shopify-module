import { Test, TestingModule } from '@nestjs/testing';
import { PagesService } from './pages.service';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('PagesService', () => {
  let service: PagesService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<PagesService>(PagesService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
