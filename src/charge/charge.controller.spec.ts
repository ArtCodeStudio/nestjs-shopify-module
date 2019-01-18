import { Test, TestingModule } from '@nestjs/testing';
import { ChargeController } from './charge.controller';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('Charge Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    const mongooseConnection = await mongooseConnectionPromise;
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, mongooseConnection, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ChargeController = module.get<ChargeController>(ChargeController);
    expect(controller).toBeDefined();
  });
});
