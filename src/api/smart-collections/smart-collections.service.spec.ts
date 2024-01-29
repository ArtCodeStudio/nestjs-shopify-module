import { Test } from '@nestjs/testing';
import { SmartCollectionsService } from './smart-collections.service';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('SmartCollectionsService', () => {
  let service: SmartCollectionsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<SmartCollectionsService>(SmartCollectionsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
