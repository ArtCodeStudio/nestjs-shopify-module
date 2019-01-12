import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { EventService } from '../event.service';

// Shopify services
import { OrdersService } from '../api/orders/orders.service';
import { ProductsService } from '../api/products/products.service';
import { PagesService } from '../api/pages/pages.service';
import { SmartCollectionsService } from '../api/smart-collections/smart-collections.service';
import { CustomCollectionsService } from '../api/custom-collections/custom-collections.service';

import { IShopifyConnect } from '../auth/interfaces/connect';
import { DebugService } from '../debug.service';
import { ISyncOptions, SyncProgressDocument, SubSyncProgressDocument } from '../interfaces';
import * as pRetry from 'p-retry';
import { access } from 'fs';

@Injectable()
export class SyncService {
  constructor(
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    private readonly eventService: EventService,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly pagesService: PagesService,
    private readonly smartCollectionsService: SmartCollectionsService,
    private readonly customCollectionsService: CustomCollectionsService
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   *
   * @param shop
   * @param id 
   * @param waitMilliseconds
   * @event sync:[shop]:[id]
   */
  async isSyncRunning(shop: string, id: string, waitMilliseconds?: number): Promise<boolean> {
    return new Promise(resolve => {
      const callback = () => {
        this.logger.debug(`isRunning: received sync:${shop}:${id}:`);
        resolve(true);
      };
      const syncSignal = `sync:${shop}:${id}`;
      this.eventService.once(syncSignal, callback);
      setTimeout(() => {
        resolve(false);
        this.eventService.off(syncSignal, callback);
      }, waitMilliseconds || 7777);
    });
  }

  /**
   *
   * @param shop
   * @param projection
   */
  async getLastShopSync(shop: string, projection: {} = {}, ) : Promise<Partial<SyncProgressDocument>> {
    return this.syncProgressModel.findOne(
      { shop },
      projection,
      { sort: { 'createdAt': -1} }
    ).lean();
  }

  /**
   *
   * @param shop
   * @param projection
   */
  async listShopSync(shop: string, projection: {} = {}, ) : Promise<Partial<SyncProgressDocument>[]> {
    return this.syncProgressModel.find(
      { shop },
      projection,
      { sort: { 'createdAt': -1} }
    ).lean();
  }

  async find(query: Partial<SyncProgressDocument>, options?: {}): Promise<SyncProgressDocument[]|null> {
    return this.syncProgressModel.find(query, {}, options).lean();
  }

  async findOne(query: Partial<SyncProgressDocument>, options?: {}): Promise<SyncProgressDocument|null> {
    return this.syncProgressModel.findOne(query, {}, options).lean();
  }

  /**
   * 
   * @param shopifyConnect 
   * @param id 
   * @event sync-cancel:[shop]:[id] ()
   * @event sync-exception:[shop]:[id] (error)
   * @event sync-exception (shop: string, error)
   */
  async cancelShopSync(shopifyConnect: IShopifyConnect, id?: string) {
    const shop = shopifyConnect.myshopify_domain;
    if (!id) {
      const lastProgress = await this.syncProgressModel.findOne(
        { shop },
        { _id: true },
        { sort: { 'createdAt': -1} }
      ).lean();
      if (lastProgress) {
        id = lastProgress._id;
      }
    }
    if (!id) {
      return null;
    }
    // Give 7.777 seconds time for the progress to be cancelled. If no response, we throw a `sync progress hanging` error.
    // If responding to cancellation, we wait for the `sync-ended` event.
    return new Promise((resolve, reject) => {
      let cancelled = false;
      this.eventService.once(`sync-cancelled:${shop}:${id}`, () => {
        cancelled = true;
      });
      this.eventService.once(`sync-ended:${shop}:${id}`, (progress) => {
        resolve(progress);
      });
      this.eventService.emit(`sync-cancel:${shop}:${id}`);
      setTimeout(() => {
        if (!cancelled) {
          const error = new Error('sync progress not resonding');
          this.eventService.emit(`sync-exception:${shop}:${id}`, error);
          this.eventService.emit(`sync-exception`, shop, error);
          reject(error);
        }
      }, 7777);
    })
    .catch((error) => {
      throw error;
    });
  }


  /**
   * @event sync-cancel:[shop]:[lastProgressId] ()
   * @event sync-ended:[shop]:[id]
   * @event sync (shop, lastProgress)
   * @event sync-exception (shop: string, error)
   */
  async startSync(shopifyConnect: IShopifyConnect, options?: ISyncOptions): Promise<SyncProgressDocument> {
    const shop = shopifyConnect.myshopify_domain;
    this.logger.debug(`startSync(
      ${shop}, 
      ${JSON.stringify(options, null, 2)}
    `);
    try {
      options = options || {
        // Continue the previous sync by default (don't resync completely)
        resync: false,
        // Include orders and products but not transactions by default
        includeOrders: true,
        includeProducts: true,
        includeTransactions: false,
        includePages: false,
        includeCustomCollections: false,
        includeSmartCollections: false,
        cancelExisting: false,
      };

      // If neither includeOrders nor includeProducts was passed, we assume by default that both should be included
      if (
           !options.includeOrders
        && !options.includeProducts
        && !options.includePages
        && !options.includeCustomCollections
        && !options.includeSmartCollections
      ) {
        options.includeOrders = true;
        options.includeProducts = true;
      }

      this.logger.debug(`startSync(${JSON.stringify(options, null, 2)}`);

      // Get the last sync progress (if it exists)
      let lastProgress: SyncProgressDocument = await this.syncProgressModel.findOne(
        { shop },
        {},
        { sort: { 'createdAt': -1} }
      );

      if (lastProgress && lastProgress.state === 'running') {
        this.logger.debug(`startSync: check if last progress ${lastProgress._id} is still running`);
        const lastProgressRunning = await this.isSyncRunning(shop, lastProgress._id);

        if (!lastProgressRunning) {
          this.logger.debug(`startSync: last progress ${lastProgress.id} marked as 'running' did not respond. Set it to 'failed'.`);
          lastProgress.state = 'failed';
          lastProgress.lastError = 'sync timed out';
          await lastProgress.save();
          // Just to make sure, we send a cancel event to the progress. Maybe he was just very busy.
          this.eventService.emit(`sync-cancel:${shop}:${lastProgress.id}`);
        } else {
          this.logger.debug('startSync: last progress is still running');
          // If the last progress is still running and includes all the options we need, we just return it, without starting a new one.
          // If the options of the running progress and the sync we want to start are incompatible, we throw a `sync in progress` error,
          // or we cancel the previous progress and start a new one if `cancelExisting` option is set.

          const checkOptions = [
            'includeProducts',
            'includeOrders',
            'includeTransactions',
            'includePages',
            'includeSmartCollections',
            'includeCustomCollections',
            'resync'
          ];

          // If `cancelExisting` option is set, we cancel the existing running progress unless it is compatible with our options.
          const cancelledExisting = checkOptions.some(key => {
            if (options[key] && !lastProgress.options[key]) {
              this.logger.debug(`startSync: running progress with options
                  ${JSON.stringify(lastProgress.options, null, 2)}
                is incompatible with new sync options:
                  ${JSON.stringify(options, null, 2)}.`);
              this.logger.debug(`${key} is missing from lastProgress`);
              if (options.cancelExisting) {
                this.logger.debug(`startSync: cancel existing progress and start a new one.`)
                this.eventService.emit(`sync-cancel:${shop}:${lastProgress._id}`);
                return true;
              } else {
                // We don't cancel but throw an error: 'sync in progress'
                throw new Error('sync in progress');
              }
            }
            return false;
          });

          if (!cancelledExisting) {
            // The existing running progress is compatible with all the options we want,
            // so we just re-emit its state and return it without starting a new one.
            this.logger.debug(`startSync: The running progress is compatible with our options ${options}`);
            this.eventService.emit(`sync`, shop, lastProgress);
            return lastProgress;
          }
        }
      }

      const progress: SyncProgressDocument = await this.syncProgressModel.create({
        shop,
        options,
        state: 'starting',
        lastError: null,
      });
      this.eventService.emit(`sync-${progress.state}`, shop, progress);

      let subSyncPromises = new Array<Promise<SubSyncProgressDocument>>();
      if (options.includeProducts) {
        subSyncPromises.push(this.productsService.startSync(shopifyConnect, options, progress, lastProgress));
      }

      if (options.includeOrders) {
        subSyncPromises.push(this.ordersService.startSync(shopifyConnect, options, progress, lastProgress));
      }

      if (options.includePages) {
        subSyncPromises.push(this.pagesService.startSync(shopifyConnect, options, progress, lastProgress));
      }

      if (options.includeSmartCollections) {
        subSyncPromises.push(this.smartCollectionsService.startSync(shopifyConnect, options, progress, lastProgress));
      }

      if (options.includeCustomCollections) {
        subSyncPromises.push(this.customCollectionsService.startSync(shopifyConnect, options, progress, lastProgress));
      }

      progress.state = 'running';
      this.eventService.emit(`sync-${progress.state}`, shop, progress);

      return Promise.all(subSyncPromises)
      .then((subProgresses) => {
        let cancelled = false;
        let failed = subProgresses.some((subProgress, i) => {
          if (subProgress.state === 'failed') {
            return true;
          }
          if (subProgress.state === 'cancelled') {
            cancelled = true;
          }
          return false;
        });
        if (failed) {
          progress.state = 'failed';
        } else if (cancelled) {
          progress.state = 'cancelled';
        } else {
          progress.state = 'success';
        }
        this.eventService.emit(`sync-${progress.state}`, shop, progress);
        return pRetry(() => { 
          return progress.save();
        })
      })
      .catch((error) => {
        this.logger.error('FIXME', error);
        progress.state = 'failed';
        progress.lastError = error.message ? error.message : error;
        this.eventService.emit(`sync-${progress.state}`, shop, progress);
        return pRetry(() => {
          return progress.save();
        })
      });
    } catch (error) {
      this.logger.debug(error);
      this.eventService.emit(`sync-exception`, shop, error);
      throw error;
    }
  }

}
