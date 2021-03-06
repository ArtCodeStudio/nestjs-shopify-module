import { Test } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { EventService } from '../event.service';

import { ShopifyModule } from '../shopify.module';
import { config, mongooseConnectionPromise } from '../../test/config.test';
import * as passport from 'passport';

import { ShopifyConnectService } from '../auth/connect.service';
import { IShopifyConnect } from '../auth/interfaces';

import { IStartSyncOptions, ISyncProgress, SyncProgressSchema, SyncProgressDocument } from '../interfaces';

import { Model } from 'mongoose';


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
      const finalProgressPromise: Promise<ISyncProgress> = new Promise((resolve, reject) => {
        eventService.on(`sync:${progress.shop}:${progress._id}`, (nextProgress) => {
          expect(nextProgress.state).not.toBe('failed');
          if (nextProgress.state === 'failed') {
            reject(new Error(`sync progress failed`));
          }
          progress.state = nextProgress.state;

          // Check each subprogress state
          ['orders', 'products', 'customCollections', 'smartCollections', 'pages']
          .some((resourceName: string) => {
            expect(nextProgress[resourceName].syncedCount)
            .toBeGreaterThanOrEqual(progress[resourceName].syncedCount);
            progress[resourceName].syncedCount = nextProgress[resourceName].syncedCount;
            if (progress[resourceName].syncedCount > nextProgress[resourceName].syncedCount) {
              reject(new Error(`${resourceName} counting backwards`));
              return true;
            }
            expect(nextProgress[resourceName].state).not.toBe('failed');
            if (nextProgress[resourceName].state === 'failed') {
              reject(new Error(`sync progress failed`));
              return true;
            }
            progress[resourceName].state = nextProgress[resourceName].state;
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
      await expect(finalProgressPromise).resolves.toMatchObject({
        shop: shopifyConnect.myshopify_domain,
        state: 'success',
        lastError: null,
        orders: {
          syncedCount: progress.orders.shopifyCount,
        },
        options: syncContentOptions,
      });
    });
  });
});
