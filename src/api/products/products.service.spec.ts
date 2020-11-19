/* tslint:disable:no-console */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ShopifyConnectService } from '../../auth/connect.service';
import { IShopifyConnect } from '../../auth/interfaces';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

const MONGODB = process.env.MONGODB && (process.env.MONGODB.toLocaleLowerCase() === 'true' || process.env.MONGODB === '1');

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
    jest.setTimeout(60000);
    it('should be run without error', async () => {
      await service.listAllFromShopify(user, { syncToDb: MONGODB }, (error, data) => {
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
      // const listFromDb = await service.listFromDb(user, {});
      if (countFromShopify >= 50) {
        expect(listFromShopify).toHaveLength(50);
      } else {
        expect(listFromShopify).toHaveLength(countFromShopify);
      }
    });

    it('list result should have a length of 2 on limit with 2', async () => {
      const _listFromShopify = await service.listFromShopify(user, {limit: 2});
      if (countFromShopify >= 2) {
        expect(_listFromShopify).toHaveLength(2);
      } else {
        expect(_listFromShopify).toHaveLength(countFromShopify);
      }
    });

    it(`The last page result should be not empty`, async () => {
      console.debug(`{limit: 2, page: ${pagesForLimit2}}`);
      const listFromShopify = await service.listFromShopify(user, {limit: 2, page: pagesForLimit2});
      expect(listFromShopify.length).toBeGreaterThan(0);
    });

    it(`The last page + 1 result should be not existing`, async () => {
      console.debug(`{limit: 2, page: ${pagesForLimit2 + 1}}`);
      const listFromShopify = await service.listFromShopify(user, {limit: 2, page: pagesForLimit2 + 1});
      expect(listFromShopify.length).toBe(0);
    });

    it(`The result should only contain the passed fields (title)`, async () => {
      const expected = {
        title: expect.any(String),
      };
      const notExpected = {
        id: expect.any(Number),
        body_html: expect.any(String),
        vendor: expect.any(String),
        product_type: expect.any(String),
        created_at: expect.any(String),
        handle: expect.any(String),
        updated_at: expect.any(String),
        published_at: expect.any(String),
        template_suffix: expect.any(String),
        tags: expect.any(String),
        published_scope: expect.any(String),
        admin_graphql_api_id: expect.any(String),
        variants: expect.any(Array),
        options: expect.any(Object),
        images: expect.any(Array),
        image: expect.any(Object),
      };
      const listFromShopify = await service.listFromShopify(user, {fields: 'title'});
      for (const getFromShopify of listFromShopify) {
        expect(getFromShopify).toEqual(expect.objectContaining(expected));
        expect(getFromShopify).toEqual(expect.not.objectContaining(notExpected));
      }
    });

    it(`The result should only contain the passed fields (title, id, tags, options, image)`, async () => {
      const expected = {
        title: expect.any(String),
        id: expect.any(Number),
        tags: expect.any(String),
        options: expect.any(Array),
        image: expect.any(Object),
      };
      const notExpected = {
        body_html: expect.any(String),
        vendor: expect.any(String),
        product_type: expect.any(String),
        created_at: expect.any(String),
        handle: expect.any(String),
        updated_at: expect.any(String),
        published_at: expect.any(String),
        template_suffix: expect.any(String),
        published_scope: expect.any(String),
        admin_graphql_api_id: expect.any(String),
        variants: expect.any(Array),
        images: expect.any(Array),
      };
      const listFromShopify = await service.listFromShopify(user, {fields: 'title, id, tags, options, image'});
      for (const getFromShopify of listFromShopify) {
        expect(getFromShopify).toEqual(expect.objectContaining(expected));
        expect(getFromShopify).toEqual(expect.not.objectContaining(notExpected));
      }
    });

    it(`The result should only contain the passed ids`, async () => {
      const ids: Array<number> = [5973525063, 5972798855, 5973283783, 5973211591, 5973132487];
      const listFromShopify = await service.listFromShopify(user, {ids: ids.join(', ')});
      expect(listFromShopify).toHaveLength(ids.length);
      for (const getFromShopify of listFromShopify) {
        expect(ids).toContain(getFromShopify.id);
      }
    });

    it(`The result should only return objects with the the passed title filter`, async () => {
      const title = 'Kette SHINY CIRCLE SINGLE LARGE 925 Sterling Silber vergoldet';
      const listFromShopify = await service.listFromShopify(user, {
        fields: 'title',
        title,
      });
      expect(listFromShopify.length).toBeGreaterThan(0);
      for (const getFromShopify of listFromShopify) {
        // console.debug('getFromShopify', getFromShopify);
        expect(getFromShopify.title.toLowerCase()).toContain(title.toLowerCase());
      }
    });

    it(`Result title property should contain "Kette"`, async () => {
      const title = 'Kette';
      const listFromShopify = await service.listFromShopify(user, {
        fields: 'title',
        title,
      });
      expect(listFromShopify.length).toBeGreaterThan(0);
      for (const getFromShopify of listFromShopify) {
        // console.debug('getFromShopify', getFromShopify);
        expect(getFromShopify.title.toLowerCase()).toContain(title.toLowerCase());
      }
    });

    it(`Result title property should contain "ette"`, async () => {
      const title = 'ette';
      const listFromShopify = await service.listFromShopify(user, {
        fields: 'title',
        title,
      });
      expect(listFromShopify.length).toBeGreaterThan(0);
      for (const getFromShopify of listFromShopify) {
        // console.debug('getFromShopify', getFromShopify);
        expect(getFromShopify.title.toLowerCase()).toContain(title.toLowerCase());
      }
    });

    // it(`Result title property should contain "ette" and "Silber"`, async () => {
    //   const title = 'ette Silber';
    //   const titles = title.split(' ');
    //   const listFromShopify = await service.listFromShopify(user, {
    //     fields: 'title',
    //     title,
    //   });
    //   expect(listFromShopify.length).toBeGreaterThan(0);
    //   for (const getFromShopify of listFromShopify) {
    //     console.debug(getFromShopify);
    //     for (const subtitle of titles) {
    //       expect(getFromShopify.title.toLowerCase()).toContain(subtitle.toLowerCase());
    //     }
    //   }
    // });

    it(`Result vendor property should contain "Jewelberry"`, async () => {
      const vendor = 'Jewelberry';
      const listFromShopify = await service.listFromShopify(user, {
        fields: 'vendor',
        vendor,
      });
      expect(listFromShopify.length).toBeGreaterThan(0);
      for (const getFromShopify of listFromShopify) {
        // console.debug('getFromShopify', getFromShopify);
        expect(getFromShopify.vendor.toLowerCase()).toContain(vendor.toLowerCase());
      }
    });

    it(`Result handle property should contain "copy-of-jewelberry-ring-tiny-flowers-925-silber"`, async () => {
      const handle = 'copy-of-jewelberry-ring-tiny-flowers-925-silber';
      const listFromShopify = await service.listFromShopify(user, {
        fields: 'handle',
        handle,
      });
      expect(listFromShopify.length).toBeGreaterThan(0);
      for (const getFromShopify of listFromShopify) {
        // console.debug('getFromShopify', getFromShopify);
        expect(getFromShopify.handle.toLowerCase()).toContain(handle.toLowerCase());
      }
    });

    it(`Result product_type property should contain "ring"`, async () => {
      const product_type = 'ring';
      const listFromShopify = await service.listFromShopify(user, {
        fields: 'product_type',
        product_type,
      });
      expect(listFromShopify.length).toBeGreaterThan(0);
      for (const getFromShopify of listFromShopify) {
        // console.debug('getFromShopify', getFromShopify);
        expect(getFromShopify.product_type.toLowerCase()).toContain(product_type.toLowerCase());
      }
    });

    it(`Result product_type property should contain "ring"`, async () => {
      const product_type = 'ring';
      const listFromShopify = await service.listFromShopify(user, {
        fields: 'product_type',
        product_type,
      });
      expect(listFromShopify.length).toBeGreaterThan(0);
      for (const getFromShopify of listFromShopify) {
        // console.debug('getFromShopify', getFromShopify);
        expect(getFromShopify.product_type.toLowerCase()).toContain(product_type.toLowerCase());
      }
    });

    it(`Filter with collection_id "251585671" should return products with product type "ring"`, async () => {
      const collection_id = '251585671';
      const listFromShopify = await service.listFromShopify(user, {
        fields: 'product_type',
        collection_id,
      });
      expect(listFromShopify.length).toBeGreaterThan(0);
      for (const getFromShopify of listFromShopify) {
        // console.debug('getFromShopify', getFromShopify);
        expect(getFromShopify.product_type.toLowerCase()).toContain('ring');
      }
    });
  });

  if (MONGODB) {
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
          expect(_listFromDb).toHaveLength(2);
        } else {
          expect(_listFromDb).toHaveLength(countFromShopify);
        }
      });

      it(`The last page should be not empty`,
      async () => {
        const _listFromDb = await service.listFromDb(user, {limit: 2, page: pagesForLimit2});
        expect(_listFromDb.length).toBeGreaterThan(0);
      });

      it(`The last page + 1 should be not existing`, async () => {
        const _listFromDb2 = await service.listFromDb(user, {limit: 2, page: pagesForLimit2 + 1});
        expect(_listFromDb2).toHaveLength(0);
      });

      it(`The result should not contain mongodb specific fields like _id and __v`, async () => {
        const notExpected = {
          _id: expect.any(Number),
          __v: expect.any(String),
        };
        const listFromDb = await service.listFromDb(user);
        for (const getFromDb of listFromDb) {
          expect(getFromDb).toEqual(expect.not.objectContaining(notExpected));
        }
      });

      it(`The result should only contain the passed fields (title)`, async () => {
        const expected = {
          title: expect.any(String),
        };
        const notExpected = {
          id: expect.any(Number),
          body_html: expect.any(String),
          vendor: expect.any(String),
          product_type: expect.any(String),
          created_at: expect.any(String),
          handle: expect.any(String),
          updated_at: expect.any(String),
          published_at: expect.any(String),
          template_suffix: expect.any(String),
          tags: expect.any(String),
          published_scope: expect.any(String),
          admin_graphql_api_id: expect.any(String),
          variants: expect.any(Array),
          options: expect.any(Object),
          images: expect.any(Array),
          image: expect.any(Object),
        };
        const listFromDb = await service.listFromDb(user, {fields: 'title'});
        for (const getFromDb of listFromDb) {
          expect(getFromDb).toEqual(expect.objectContaining(expected));
          expect(getFromDb).toEqual(expect.not.objectContaining(notExpected));
        }
      });

      it(`The result should only contain the passed fields (title, id, tags, options, image)`, async () => {
        const expected = {
          title: expect.any(String),
          id: expect.any(Number),
          tags: expect.any(String),
          options: expect.any(Array),
          image: expect.any(Object),
        };
        const notExpected = {
          body_html: expect.any(String),
          vendor: expect.any(String),
          product_type: expect.any(String),
          created_at: expect.any(String),
          handle: expect.any(String),
          updated_at: expect.any(String),
          published_at: expect.any(String),
          template_suffix: expect.any(String),
          published_scope: expect.any(String),
          admin_graphql_api_id: expect.any(String),
          variants: expect.any(Array),
          images: expect.any(Array),
        };
        const listFromDb = await service.listFromDb(user, {fields: 'title, id, tags, options, image'});
        for (const getFromDb of listFromDb) {
          expect(getFromDb).toEqual(expect.objectContaining(expected));
          expect(getFromDb).toEqual(expect.not.objectContaining(notExpected));
        }
      });

      it(`The result should only contain the passed ids`, async () => {
        const ids: Array<number> = [5973525063, 5972798855, 5973283783, 5973211591, 5973132487];
        const listFromDb = await service.listFromDb(user, {ids: ids.join(', ')});
        // console.debug('ids', ids);
        // console.debug('ids', ids.join(', '));
        expect(listFromDb).toHaveLength(ids.length);
        for (const getFromDb of listFromDb) {
          expect(ids).toContain(getFromDb.id);
        }
      });

      it(`The result should only return objects with the the passed title filter`, async () => {
        const title = 'Kette SHINY CIRCLE SINGLE LARGE 925 Sterling Silber vergoldet';
        const listFromDb = await service.listFromDb(user, {
          fields: 'title',
          title,
        });
        expect(listFromDb.length).toBeGreaterThan(0);
        for (const getFromDb of listFromDb) {
          // console.debug('getFromDb', getFromDb);
          expect(getFromDb.title.toLowerCase()).toContain(title.toLowerCase());
        }
      });

      it(`Result title property should contain "Kette"`, async () => {
        const title = 'Kette';
        const listFromDb = await service.listFromDb(user, {
          fields: 'title',
          title,
        });
        expect(listFromDb.length).toBeGreaterThan(0);
        for (const getFromDb of listFromDb) {
          // console.debug('getFromDb', getFromDb);
          expect(getFromDb.title.toLowerCase()).toContain(title.toLowerCase());
        }
      });

      it(`Result title property should contain "ette"`, async () => {
        const title = 'ette';
        const listFromDb = await service.listFromDb(user, {
          fields: 'title',
          title,
        });
        expect(listFromDb.length).toBeGreaterThan(0);
        for (const getFromDb of listFromDb) {
          // console.debug('getFromDb', getFromDb);
          expect(getFromDb.title.toLowerCase()).toContain(title.toLowerCase());
        }
      });

      // it(`Result title property should contain "ette" and "Silber"`, async () => {
      //   const title = 'ette Silber';
      //   const titles = title.split(' ');
      //   const listFromDb = await service.listFromDb(user, {
      //     fields: 'title',
      //     title,
      //   });
      //   expect(listFromDb.length).toBeGreaterThan(0);
      //   for (const getFromDb of listFromDb) {
      //     console.debug(getFromDb);
      //     for (const subtitle of titles) {
      //       expect(getFromDb.title.toLowerCase()).toContain(subtitle.toLowerCase());
      //     }
      //   }
      // });

      it(`Result vendor property should contain "Jewelberry"`, async () => {
        const vendor = 'Jewelberry';
        const listFromDb = await service.listFromDb(user, {
          fields: 'vendor',
          vendor,
        });
        expect(listFromDb.length).toBeGreaterThan(0);
        for (const getFromDb of listFromDb) {
          // console.debug('getFromDb', getFromDb);
          expect(getFromDb.vendor.toLowerCase()).toContain(vendor.toLowerCase());
        }
      });

      it(`Result handle property should contain "copy-of-jewelberry-ring-tiny-flowers-925-silber"`, async () => {
        const handle = 'copy-of-jewelberry-ring-tiny-flowers-925-silber';
        const listFromDb = await service.listFromDb(user, {
          fields: 'handle',
          handle,
        });
        expect(listFromDb.length).toBeGreaterThan(0);
        for (const getFromDb of listFromDb) {
          // console.debug('getFromDb', getFromDb);
          expect(getFromDb.handle.toLowerCase()).toContain(handle.toLowerCase());
        }
      });

      it(`Result product_type property should contain "ring"`, async () => {
        const product_type = 'ring';
        const listFromDb = await service.listFromDb(user, {
          fields: 'product_type',
          product_type,
        });
        expect(listFromDb.length).toBeGreaterThan(0);
        for (const getFromDb of listFromDb) {
          // console.debug('getFromDb', getFromDb);
          expect(getFromDb.product_type.toLowerCase()).toContain(product_type.toLowerCase());
        }
      });

      it(`Result product_type property should contain "ring"`, async () => {
        const product_type = 'ring';
        const listFromDb = await service.listFromDb(user, {
          fields: 'product_type',
          product_type,
        });
        expect(listFromDb.length).toBeGreaterThan(0);
        for (const getFromDb of listFromDb) {
          // console.debug('getFromDb', getFromDb);
          expect(getFromDb.product_type.toLowerCase()).toContain(product_type.toLowerCase());
        }
      });

      it(`Filter with collection_id "251585671" should return products with product type "ring"`, async () => {
        const collection_id = '251585671';
        const listFromDb = await service.listFromDb(user, {
          fields: 'product_type',
          collection_id,
        });
        expect(listFromDb.length).toBeGreaterThan(0);
        for (const getFromDb of listFromDb) {
          // console.debug('getFromDb', getFromDb);
          expect(getFromDb.product_type.toLowerCase()).toContain('ring');
        }
      });

    });
  }

  if (MONGODB) {
    describe('countFromDb', async () => {
      it(`Should be equal to count from shopify`, async () => {
        const _countFromDb = await service.countFromDb(user);
        expect(_countFromDb).toBe(countFromShopify);
      });
    });
  }

});
