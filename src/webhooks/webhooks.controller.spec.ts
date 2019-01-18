import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('Webhooks Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: WebhooksController = module.get<WebhooksController>(WebhooksController);
    expect(controller).toBeDefined();
  });
});
