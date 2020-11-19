import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('Sync Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: SyncController = module.get<SyncController>(SyncController);
    expect(controller).toBeDefined();
  });
});
