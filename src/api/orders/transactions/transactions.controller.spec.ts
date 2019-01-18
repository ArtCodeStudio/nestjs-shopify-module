import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';

import { ShopifyModule } from '../../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../../test/config.test';
import * as passport from 'passport';

describe('Transactions Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: TransactionsController = module.get<TransactionsController>(TransactionsController);
    expect(controller).toBeDefined();
  });
});
