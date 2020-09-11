import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { EventService } from '../event.service';

// Shopify services
import { OrdersService } from '../api/orders/orders.service';
import { ProductsService } from '../api/products/products.service';
import { PagesService } from '../api/pages/pages.service';
import { BlogsService } from '../api/blogs/blogs.service';
import { ArticlesService } from '../api/blogs/articles/articles.service';
import { SmartCollectionsService } from '../api/smart-collections/smart-collections.service';
import { CustomCollectionsService } from '../api/custom-collections/custom-collections.service';

import { IShopifyConnect } from '../auth/interfaces/connect';
import { DebugService } from '../debug.service';
import { IStartSyncOptions, SyncProgressDocument, SubSyncProgressDocument, ISubSyncProgress } from '../interfaces';
// import * as pRetry from 'p-retry';
import { mongooseParallelRetry } from '../helpers';

@Injectable()
export class SyncService {

  protected logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    private readonly eventService: EventService,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly pagesService: PagesService,
    private readonly blogsService: BlogsService,
    private readonly articlesService: ArticlesService,
    private readonly smartCollectionsService: SmartCollectionsService,
    private readonly customCollectionsService: CustomCollectionsService,
  ) {
    this.find({
      state: 'running',
    })
    .then((progresses) => {
      // Cancel running progresses
      this.logger.debug('Cancel running progresses', progresses);
      const promises = new Array<Promise<SyncProgressDocument>>();
      progresses.forEach((progress: SyncProgressDocument) => {
        promises.push(this.update({_id: progress._id}, {state: 'cancelled'}));
      });
      return Promise.all(promises);
    })
    .then((_) => {
      this.logger.debug('Running progresses cancelled');
      return _;
    })
    .catch((error) => {
      this.logger.debug('Can\'t cancel running progresses');
      this.logger.error(error);
    });
  }

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
  async getLastShopSync(shop: string, projection: {} = {}): Promise<Partial<SyncProgressDocument>> {
    return this.syncProgressModel.findOne(
      { shop },
      projection,
    ).lean();
  }

  /**
   *
   * @param shop
   * @param projection
   */
  async listShopSync(shop: string, projection: {} = {}): Promise<Partial<SyncProgressDocument>[]> {
    return this.syncProgressModel.find(
      { shop },
      projection,
      { sort: { createdAt: -1} },
    ).lean();
  }

  async find(query: Partial<SyncProgressDocument>, options?: {}): Promise<SyncProgressDocument[]|null> {
    return this.syncProgressModel.find(query, {}, options).lean();
  }

  async update(conditions: Partial<SyncProgressDocument>, progress: Partial<SyncProgressDocument>, options?: {}): Promise<SyncProgressDocument> {
    return this.syncProgressModel.findOneAndUpdate(conditions, progress, options);
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
  async startSync(shopifyConnect: IShopifyConnect, options: IStartSyncOptions): Promise<SyncProgressDocument> {
    const shop = shopifyConnect.myshopify_domain;
    this.logger.debug(`[startSync] (${shop})`);
    try {
      options.syncToDb = !!options.syncToDb;
      options.syncToSwiftype = !!options.syncToSwiftype;
      options.syncToEs = !!options.syncToEs;
      options.resync = !!options.resync;
      options.includeOrders = !!options.includeOrders;
      options.includeProducts = !!options.includeProducts;
      options.includeTransactions = !!options.includeTransactions;
      options.includePages = !!options.includePages;
      options.includeCustomCollections = !!options.includeCustomCollections;
      options.includeSmartCollections = !!options.includeSmartCollections;
      options.cancelExisting = !!options.cancelExisting;

      // If neither includeOrders nor includeProducts was passed, we assume by default that both should be included
      if (
           !options.includeOrders
        && !options.includeProducts
        && !options.includePages
        && !options.includeCustomCollections
        && !options.includeSmartCollections
      ) {
        throw new Error('At least one shopify record must be synchronized!');
      }

      if (!options.syncToDb && !options.syncToSwiftype && !options.syncToEs) {
        throw new Error('At least one synchronization target must be defined!');
      }

      this.logger.debug(`[startSync] (${JSON.stringify(options, null, 2)}`);

      // Get the last sync progress (if it exists)
      const lastProgress: SyncProgressDocument | null = await this.syncProgressModel.findOne(
        { shop },
        {},
      );

      if (lastProgress && lastProgress.state === 'running') {
        this.logger.debug(`[startSync] Check if last progress ${lastProgress._id} is still running`);
        const lastProgressRunning = await this.isSyncRunning(shop, lastProgress._id);

        if (!lastProgressRunning) {
          this.logger.debug(`[startSync] Last progress ${lastProgress.id} marked as 'running' did not respond. Set it to 'failed'.`);
          lastProgress.state = 'failed';
          lastProgress.lastError = 'sync timed out';
          await lastProgress.save();
          // Just to make sure, we send a cancel event to the progress. Maybe he was just very busy.
          this.eventService.emit(`sync-cancel:${shop}:${lastProgress.id}`);
        } else {
          this.logger.debug('[startSync] Last progress is still running');
          // If the last progress is still running and includes all the options we need, we just return it, without starting a new one.
          // If the options of the running progress and the sync we want to start are incompatible, we throw a `sync in progress` error,
          // or we cancel the previous progress and start a new one if `cancelExisting` option is set.

          const checkOptions = [
            'syncToDb',
            'syncToSwiftype',
            'syncToEs',
            'includeProducts',
            'includeOrders',
            'includeTransactions',
            'includePages',
            'includeSmartCollections',
            'includeCustomCollections',
            'resync',
          ];

          // If `cancelExisting` option is set, we cancel the existing running progress unless it is compatible with our options.
          const cancelledExisting = checkOptions.some(key => {
            if (options[key] && !lastProgress.options[key]) {
              this.logger.debug(`[startSync] running progress with options
                  ${JSON.stringify(lastProgress.options, null, 2)}
                is incompatible with new sync options:
                  ${JSON.stringify(options, null, 2)}.`);
              this.logger.debug(`${key} is missing from lastProgress`);
              if (options.cancelExisting) {
                this.logger.debug(`[startSync] cancel existing progress and start a new one.`);
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
            this.logger.debug(`[startSync] The running progress is compatible with our options`);
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
      } as any); // TODO NEST7 CHECKME

      const subprogressServices = [
        this.ordersService,
        this.productsService,
        this.smartCollectionsService,
        this.customCollectionsService,
        this.pagesService,
        this.blogsService,
      ];

      const subSyncFinishedPromises = new Array<Promise<SubSyncProgressDocument>>();
      for (const subService of subprogressServices) {
        if (options[`include${subService.upperCaseResourceName}`]) {
          this.logger.debug(`start subprogress: ${subService.resourceName}`);
          let resolveSubProgress: (subdoc: SubSyncProgressDocument) => void;
          let rejectSubProgress: (error: Error) => void;
          const subSyncFinishedPromise = new Promise<SubSyncProgressDocument>((resolve, reject) => {
            resolveSubProgress = resolve;
            rejectSubProgress = reject;
          });
          subSyncFinishedPromises.push(subSyncFinishedPromise);
          try {
            await subService.startSync(
              shopifyConnect,
              options,
              progress,
              lastProgress,
              resolveSubProgress,
            );
          } catch (error) {
            rejectSubProgress(error);
          }
        }
      }

      progress.state = 'running';

      // We don't want to return the result of this promise, but the initialized progress as it is now immediately.
      Promise.all(subSyncFinishedPromises).then((subProgresses) => {
        this.logger.debug('[startSync] All syncs done');
        let cancelled = false;
        const failed = subProgresses.some((subProgress, i) => {
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
        return mongooseParallelRetry(() => {
          this.eventService.emit(`save progress`, progress);
          return progress.save();
        });
      })
      .catch((error) => {
        this.logger.error('FIXME', error);
        progress.state = 'failed';
        progress.lastError = error.message ? error.message + (process.env.NODE_ENV === 'development' ? '\n' + error.stack : '') : error;
        this.eventService.emit(`sync-${progress.state}`, shop, progress);
        return mongooseParallelRetry(() => {
          this.eventService.emit(`save progress`, progress);
          return progress.save();
        });
      });

      // return the initialized progress immediately
      return progress;
    } catch (error) {
      this.logger.error(error);
      this.eventService.emit(`sync-exception`, shop, error);
      throw error;
    }
  }

}
