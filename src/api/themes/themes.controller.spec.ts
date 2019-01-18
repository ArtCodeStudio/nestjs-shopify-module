import { Test, TestingModule } from '@nestjs/testing';
import { ThemesController } from './themes.controller';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('Themes Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ThemesController = module.get<ThemesController>(ThemesController);
    expect(controller).toBeDefined();
  });
});
