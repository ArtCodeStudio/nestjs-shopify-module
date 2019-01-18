import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<WebhooksService>(WebhooksService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
