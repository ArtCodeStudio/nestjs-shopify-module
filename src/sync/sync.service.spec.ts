import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('SyncService', () => {
  let service: SyncService;

  beforeAll(async () => {
    const mongooseConnection = await mongooseConnectionPromise;
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, mongooseConnection, passport)],
    }).compile();
    service = module.get<SyncService>(SyncService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
