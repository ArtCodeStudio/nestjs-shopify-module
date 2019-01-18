import { Test, TestingModule } from '@nestjs/testing';
import { ThemesService } from './themes.service';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('ThemesService', () => {
  let service: ThemesService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<ThemesService>(ThemesService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
