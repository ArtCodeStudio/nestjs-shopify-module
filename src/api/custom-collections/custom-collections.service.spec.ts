import { Test } from '@nestjs/testing';
import { CustomCollectionsService } from './custom-collections.service';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('CustomCollectionsService', () => {
  let service: CustomCollectionsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
    service = module.get<CustomCollectionsService>(CustomCollectionsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
