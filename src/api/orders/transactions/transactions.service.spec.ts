import { Test } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';

import { ShopifyModule } from '../../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../../test/config.test';
import * as passport from 'passport';

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<TransactionsService>(TransactionsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
