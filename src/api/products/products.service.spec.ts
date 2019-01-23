/* tslint:disable:no-console */

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
  let countFromShopify: number;
  let pagesForLimit2: number;

  beforeAll(async (done) => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    shopifyConnectService = module.get<ShopifyConnectService>(ShopifyConnectService);

    user = await shopifyConnectService.findByDomain('jewelberry-dev.myshopify.com');

    countFromShopify = await service.countFromShopify(user, {});
    pagesForLimit2 = Math.ceil((countFromShopify / 2));

    done();
  });

  describe('listAllFromShopify', () => {
    // Set longer jest timeout for sync
    jest.setTimeout(30000);
    it('should be run without error', async () => {
      await service.listAllFromShopify(user, { syncToDb: true, syncToSearch: true}, (error, data) => {
        console.debug(`listAllFromShopify page callback: ${data.page}/${data.pages}`);
        expect(error).toBe(null);
        expect(data.data.length).toBeGreaterThan(0);
      });
    });
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
    it('result should be a number', async () => {
      expect(typeof(countFromShopify)).toBe('number');
    });
  });

  describe('listFromShopify', async () => {

    it('should have the default limit of 50', async () => {
      const listFromShopify = await service.listFromShopify(user, {});
      const listFromDb = await service.listFromDb(user, {});
      if (countFromShopify >= 50) {
        expect(listFromShopify.length).toBe(50);
      } else {
        expect(listFromShopify.length).toBe(countFromShopify);
      }
    });

    it('list result should have a length of 2 on limit with 2', async () => {
      const _listFromShopify = await service.listFromShopify(user, {limit: 2});
      if (countFromShopify >= 2) {
        expect(_listFromShopify.length).toBe(2);
      } else {
        expect(_listFromShopify.length).toBe(countFromShopify);
      }
    });

    it(`The last page result should be not empty`, async () => {
      console.debug(`{limit: 2, page: ${pagesForLimit2}}`);
      const _listFromShopify2 = await service.listFromShopify(user, {limit: 2, page: pagesForLimit2});
      expect(_listFromShopify2.length).toBeGreaterThan(0);
    });

    it(`The last page + 1 result should be not existing`, async () => {
      console.debug(`{limit: 2, page: ${pagesForLimit2 + 1}}`);
      const _listFromShopify2 = await service.listFromShopify(user, {limit: 2, page: pagesForLimit2 + 1});
      expect(_listFromShopify2.length).toBe(0);
    });

  });

  describe('listFromDb', async () => {
    it('listFromShopify and listFromDb list results should have the same length', async () => {
      const listFromShopify = await service.listFromShopify(user, {});
      const listFromDb = await service.listFromDb(user, {});
      expect(listFromShopify.length).toBe(listFromDb.length);
    });

    it('should have the default limit of 50', async () => {
      const listFromDb = await service.listFromDb(user, {});
      if (countFromShopify >= 50) {
        expect(listFromDb.length).toBe(50);
      } else {
        expect(listFromDb.length).toBe(countFromShopify);
      }
    });

    it('listFromDb({limit: 2}) list result should have a length of 2', async () => {
      const _listFromDb = await service.listFromDb(user, {limit: 2});
      if (countFromShopify >= 2) {
        expect(_listFromDb.length).toBe(2);
      } else {
        expect(_listFromDb.length).toBe(countFromShopify);
      }
    });

    it(`The last page should be not empty`,
    async () => {
      const _listFromDb = await service.listFromDb(user, {limit: 2, page: pagesForLimit2});
      expect(_listFromDb.length).toBeGreaterThan(0);
    });

    it(`The last page + 1 should be not existing`, async () => {
      const _listFromDb2 = await service.listFromDb(user, {limit: 2, page: pagesForLimit2 + 1});
      expect(_listFromDb2.length).toBe(0);
    });
  });

  describe('listFromSearch', async () => {

    it('listFromShopify and listFromSearch list results should have the same length', async () => {
      const listFromShopify = await service.listFromShopify(user, {});
      const listFromSearch = await service.listFromSearch(user, {});
      expect(listFromShopify.length).toBe(listFromSearch.length);
    });

    it('should have the default limit of 50', async () => {
      const listFromSearch = await service.listFromSearch(user, {});
      if (countFromShopify >= 50) {
        expect(listFromSearch.length).toBe(50);
      } else {
        expect(listFromSearch.length).toBe(countFromShopify);
      }
    });

    it('List result should have a length of 2 on limit 2', async () => {
      const _listFromSearch = await service.listFromSearch(user, {limit: 2});
      if (countFromShopify >= 2) {
        expect(_listFromSearch.length).toBe(2);
      } else {
        expect(_listFromSearch.length).toBe(countFromShopify);
      }
    });

    it(`The last page should be existing`, async () => {
      console.debug(`{limit: 2, page: ${pagesForLimit2}}`);
      const _listFromShopify = await service.listFromShopify(user, {limit: 2, page: pagesForLimit2});
      expect(_listFromShopify.length).toBeGreaterThan(0);
    });

    it(`The last page + 1 should be not existing`, async () => {
      console.debug(`{limit: 2, page: ${pagesForLimit2 + 1}}`);
      const _listFromSearch2 = await service.listFromSearch(user, {limit: 2, page: pagesForLimit2 + 1});
      expect(_listFromSearch2.length).toBe(0);
    });
  });

  describe('countFromDb', async () => {
    it(`Should be equal to count from shopify`, async () => {
      const _countFromDb = await service.countFromDb(user);
      expect(_countFromDb).toBe(countFromShopify);
    });
  });

  describe('countFromSearch', async () => {
    it(`Should be equal to count from shopify`, async () => {
      const _countFromSearch = await service.countFromSearch(user);
      expect(_countFromSearch).toBe(countFromShopify);
    });
  });
});
