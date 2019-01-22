import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ShopifyConnectService } from '../../auth/connect.service';
import { IShopifyConnect } from '../../auth/interfaces';
import { Models } from 'shopify-prime';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('ProductsService', () => {
  let service: ProductsService;
  let module: TestingModule;
  let shopifyConnectService: ShopifyConnectService;
  let user: IShopifyConnect;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    shopifyConnectService = module.get<ShopifyConnectService>(ShopifyConnectService);

    user = await shopifyConnectService.findByDomain('jewelberry-dev.myshopify.com')
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listFromShopify', () => {
    it('should be defined', () => {
      expect(service.listFromShopify).toBeDefined();
    });
  });

  describe('countFromShopify', () => {
    it('should be defined', () => {
      expect(service.countFromShopify).toBeDefined();
    });
  });

  describe('compare list methods', async () => {
    let countFromShopify: number;
    let listFromShopify: Partial<Models.Product>[] = [];

    it('count should be a number', async () => {
      countFromShopify = await service.countFromShopify(user, {});
      expect(typeof(countFromShopify)).toBe('number');
    });

    it('shopifyListResult should have the same length like count', async () => {
      listFromShopify = await service.listFromShopify(user, {});
      expect(listFromShopify.length).toBe(countFromShopify);
    });
  });
});
