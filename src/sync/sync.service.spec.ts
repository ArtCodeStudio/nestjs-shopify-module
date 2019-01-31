import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { EventService } from '../event.service';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

import { ShopifyConnectService } from '../auth/connect.service';
import { IShopifyConnect } from '../auth/interfaces';

import { IStartSyncOptions, ISyncProgress, SyncProgressSchema, SyncProgressDocument, SubSyncProgressDocument, ISubSyncProgress } from '../interfaces';

import { MongooseDocument, Model } from 'mongoose';
import { ShopifyApiRootCountableService } from '../api/shopify-api-root-countable.service';
import { resolve } from 'dns';


describe('SyncService', () => {
  let service: SyncService;
  let eventService: EventService;
  let shopifyConnect: IShopifyConnect;
  let shopifyConnectService: ShopifyConnectService;

  beforeAll(async () => {
    const mongooseConnection = await mongooseConnectionPromise;
    const module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, mongooseConnection, passport)],
    }).compile();
    service = module.get<SyncService>(SyncService);
    eventService = module.get<EventService>(EventService);

    shopifyConnectService = module.get<ShopifyConnectService>(ShopifyConnectService);

    shopifyConnect = await shopifyConnectService.findByDomain('jewelberry-dev.myshopify.com');

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  describe('startSync all resources to all DBs', async () => {


    jest.setTimeout(60000);
    const syncDbOptions = {
      syncToDb: true,
      /**
       * If true, sync the receive data to internal search engine (Elasticsearch)
       */
      syncToSwiftype: true,
      /**
       * If true, sync the receive data to internal search engine (Swiftype)
       */
      syncToEs: true,
    };
    const syncContentOptions = {
      includeOrders: true,
      includeTransactions: true,
      includeProducts: true,
      includePages: true,
      includeCustomCollections: true,
      includeSmartCollections: true,
      resync: true,
      cancelExisting: false,
    };
    const options: IStartSyncOptions = {
      ...syncDbOptions,
      ...syncContentOptions,
    };

    let progress: SyncProgressDocument;

    beforeAll(async () => {
      progress = await service.startSync(shopifyConnect, options);
    });

    it('should return a sync progress object with initialized properties', async () => {
      expect(progress).toBeInstanceOf(Model);
      expect(progress.schema).toEqual(SyncProgressSchema);
      expect(progress).toMatchObject({
        shop: shopifyConnect.myshopify_domain,
        state: 'running',
        lastError: null,
        options: syncContentOptions,
      });
      ['orders', 'products', 'customCollections', 'smartCollections', 'pages']
      .forEach((resourceName: string) => {
        expect(progress).toHaveProperty(resourceName);
        expect(progress[resourceName]).toMatchObject({
        //  _id: expect.any(String),
          shop: shopifyConnect.myshopify_domain,
          sinceId: 0,
          lastId: null,
          info: null,
          syncedCount: 0,
        //  shopifyCount: expect.any(Number),
          state: 'running',
          error: null,
        //  updatedAt: expect.any(Date),
        //  createdAt: expect.any(Date),
        });
        expect(progress[resourceName]).toHaveProperty('_id');
        expect(progress[resourceName]).toHaveProperty('createdAt');
        expect(progress[resourceName]).toHaveProperty('updatedAt');
        expect(progress[resourceName]).toHaveProperty('shopifyCount');
        if (resourceName === 'orders') {
          expect(progress[resourceName]).toHaveProperty('syncedTransactionsCount', 0);
        }
      });
    });

    it('should increase the object counts with each event and not fail', async () => {
      let finalProgress: ISyncProgress = await new Promise((resolve, reject) => {
        eventService.on(`sync:${progress.shop}:${progress._id}`, (nextProgress) => {
          expect(progress.state).not.toBe('failed');
          ['orders', 'products', 'customCollections', 'smartCollections', 'pages']
          .some((resourceName: string) => {
            expect(nextProgress[resourceName].syncedCount).toBeGreaterThanOrEqual(progress[resourceName].syncedCount);
            progress[resourceName].syncedCount = nextProgress[resourceName].syncedCount;
            if (progress[resourceName].syncedCount > nextProgress[resourceName].syncedCount) {
              reject(new Error(`${resourceName} counting backwards`));
              return true;
            }
            expect(progress[resourceName].state).not.toBe('failed');
            return false;
          });
        });
        eventService.on(`sync-ended:${progress.shop}:${progress._id}`, (nextProgress) => {
          resolve(nextProgress);
        });
        eventService.on(`sync-failed:${progress.shop}:${progress._id}`, (nextProgress) => {
          reject(new Error(nextProgress.lastError));
        });
      });
      expect(finalProgress.state).toBe('success');
    });
  });
});
