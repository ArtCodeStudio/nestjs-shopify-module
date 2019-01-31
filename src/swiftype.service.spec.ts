import { Test, TestingModule } from '@nestjs/testing';
import { SwiftypeService } from './swiftype.service';

import { ShopifyModule } from './shopify.module';
import { config, mongooseConnectionPromise } from '../test/config.test';
import * as passport from 'passport';

describe('SwiftypeService', () => {
  let service: SwiftypeService;
  beforeAll(async () => {
    const mongooseConnection = await mongooseConnectionPromise;
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, mongooseConnection, passport)],
    }).compile();
    service = module.get<SwiftypeService>(SwiftypeService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
