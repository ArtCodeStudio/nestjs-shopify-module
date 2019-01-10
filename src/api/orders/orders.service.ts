import { Inject, Injectable } from '@nestjs/common';
import { Orders, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Order } from 'shopify-prime/models';
import { OrderDocument } from '../interfaces/mongoose/order.schema';
import { Model } from 'mongoose';
import { EventService } from '../../event.service';
import { OrderSyncProgressDocument, ISyncProgress, SyncProgressDocument } from '../../interfaces';
import { TransactionsService } from './transactions/transactions.service';
import * as pRetry from 'p-retry';
import { ShopifyApiRootCountService } from '../api.service';


export interface OrderListOptions extends Options.OrderListOptions {
  sync?: boolean;
  failOnSyncError?: boolean;
}

export interface OrderGetOptions extends Options.FieldOptions {
  sync?: boolean;
}

export interface OrderCountOptions extends Options.OrderCountOptions {
}

export interface OrderSyncOptions {
  resync?: boolean,
  includeTransactions?: boolean,
  attachToExisting?: boolean,
  cancelExisting?: boolean,
}

@Injectable()
export class OrdersService extends ShopifyApiRootCountService<
  Order, // ShopifyObjectType
  Orders, // ShopifyModelClass
  OrderCountOptions, // CountOptions
  OrderGetOptions, // GetOptions
  OrderListOptions, // ListOptions
  OrderDocument // DatabaseDocumentType
  > {
  constructor(
    @Inject('OrderModelToken')
    private readonly orderModel: (shopName: string) => Model<OrderDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
    private readonly transactionsService: TransactionsService,
  ) {
    super(orderModel, Orders);
  }

  async listSyncProgress(user: IShopifyConnect): Promise<ISyncProgress[]> {
    // Mongoose order sync progress model
    return this.syncProgressModel.find({
      shop: user.shop.myshopify_domain,
      'options.includeOrders': true,
    }).lean();
  }

  async getLastSyncProgress(user: IShopifyConnect): Promise<ISyncProgress | null> {
    // Mongoose order sync progress model
    return await this.syncProgressModel.findOne(
      {
        shop: user.shop.myshopify_domain,
        'options.includeOrders': true,
      },
      {},
      { sort: { 'createdAt': -1} }
    )
    .lean();
  }

  async startSync(user: IShopifyConnect, options?: OrderSyncOptions, progress?: SyncProgressDocument, lastProgress?: SyncProgressDocument): Promise<SyncProgressDocument> {
    this.logger.debug(
      `OrdersService.startSync(
        myShopifyDomain=${user.shop.myshopify_domain},
        resync=${options.resync},
        includeTransactions=${options.includeTransactions},
        attachToExisting=${options.attachToExisting},
        cancelExisting=${options.cancelExisting},
      )`);

    // Shopify products model
    const orders = new Orders(user.myshopify_domain, user.accessToken);

    const shop: string = user.shop.myshopify_domain;

    let isCancelled: boolean = false;

    if (!progress) {
      this.logger.debug(`no progress passed as parameter`);
      options = options || {
        // Continue the previous sync by default (don't resync completely).
        resync: false,
        // Don't include transactions by default.
        includeTransactions: false,
        // Don't attach this orders sync progress to a running, existing sync progress by default.
        attachToExisting: false,
      };

      if (lastProgress && lastProgress.state === 'running' ) {
        let tooLate = false;
        this.logger.debug(`check if last progress ${lastProgress.id} is still running`);
        const lastProgressRunning = await new Promise(resolve => {
          let time: number;
          this.eventService.once(`sync-${shop}:${lastProgress._id}`, () => {
            this.logger.debug(`received pong sync-${shop}:${lastProgress._id}:`, tooLate?'too late':'just in time', Date.now()-time);
            resolve(true);
          });
          time = Date.now();
          setTimeout(() => resolve(false), 7777);
        });
        tooLate=true;
        if (!lastProgressRunning) {
          this.logger.debug('last progress has failed');
          lastProgress.state = 'failed';
          lastProgress.lastError = 'sync timed out';
          await lastProgress.save();
          // Just to make sure, we send a cancel event to the progress. Maybe he was just very busy.
          this.eventService.emit(`sync-cancel:${shop}:${lastProgress._id}`);
        } else {
          // If the last progress is still running and includes orders and all options we need, we just return it, without starting a new one.
          // If the running progress does not include orders and the option `attachToExisting` is set, we include the order sync in the running progress.
          // If the options of the running progress and the sync we want to start are incompatible, we throw a `sync in progress` error.
          if (lastProgress.options.includeOrders) {
            if (options.resync && !lastProgress.options.resync) {
              if (options.cancelExisting) {
                this.eventService.emit(`sync-cancel:${shop}:${lastProgress._id}`);
              } else {
                throw new Error('sync in progress');
              }
            }
            if (options.includeTransactions && !lastProgress.options.includeTransactions) {
              if (options.cancelExisting) {
                this.eventService.emit(`sync-cancel:${shop}:${lastProgress._id}`);
              } else {
                throw new Error('sync in progress');
              }
            } else {
              // Options are compatible with already running sync. We just re-emit the events and return the running progress.
              this.eventService.emit(`sync`, shop, lastProgress); // Why global? Because it's only of interest to the global caller.
              this.logger.debug('return last running progress', lastProgress);
              return lastProgress;
            }
          } else if (options.attachToExisting) {
            this.logger.debug('attach order sync to lastProgress:', lastProgress);
            progress = lastProgress;
            this.eventService.emit(`sync-attach:${shop}:${progress._id}`, 'orders');
            progress.options.includeOrders = true;
            await progress.save();
          } else {
            if (options.cancelExisting) {
              this.eventService.emit(`sync-cancel:${shop}:${lastProgress._id}`);
            } else {
              throw new Error('sync in progress');
            }
          }
        }
      }

      if (!progress) {
        // Create a new sync progress
        this.logger.debug(`create new SyncProgress`);
        progress = await this.syncProgressModel.create({
          shop: user.shop.myshopify_domain,
          options: {
            includeProducts: false,
            includeOrders: true,
            includeTransactions: !!options.includeTransactions,
            resync: !!options.resync,
          },
          state: 'running',
          lastError: null,
        });
        this.logger.debug('newly created SyncProgress:', progress);
      }
    } else {
      this.logger.debug('progress passed as parameter:', progress);
      this.logger.debug('lastProgress:', lastProgress);
    }

    const attachCallback = (resource: string) => {
      if (resource === 'products') {
        progress.options.includeProducts = true;
      }
    }
    this.eventService.on(`sync-attach:${shop}:${progress._id}`, attachCallback);

    const cancelCallback = () => {
      isCancelled = true;
      this.eventService.emit(`sync-cancelled:${shop}:${progress._id}`);
    };
    this.eventService.once(`sync-cancel:${shop}:${progress._id}`, cancelCallback);

    if (isCancelled) {
      this.eventService.off(`sync-attach:${shop}:${progress._id}`, attachCallback);
      this.eventService.off(`sync-cancel:${shop}:${progress._id}`, cancelCallback);
      progress.state = 'cancelled';
      progress.orders.state = 'cancelled';
      pRetry(() => {
        return progress.save()
      });
      return progress;
    }

    let seedOrdersProgress : any = {
      shop: user.shop.myshopify_domain,
      sinceId: 0,
      lastId: null,
      syncedCount: 0,
      syncedTransactionsCount: 0,
      includeTransactions: options.includeTransactions,
      shopifyCount: await pRetry(() => orders.count({ status: 'any' })),
      state: 'running',
      error: null,
    }
    if (!options.resync && lastProgress) {
      let lastOrdersProgress: OrderSyncProgressDocument | null;
      let lastProgressWithOrders: SyncProgressDocument | null;

      if (lastProgress.orders) {
        lastProgressWithOrders = lastProgress;
        lastOrdersProgress = lastProgress.orders;
      } else {
        const lastProgressWithOrdersQuery = {
          shop: user.shop.myshopify_domain,
          'options.includeOrders': true,
        };
        // If we continue a previous sync progress, check if we need transactions included
        if (options.includeTransactions) {
          lastProgressWithOrdersQuery['options.includeTransactions'] = true;
        }
        if (isCancelled) {
          this.eventService.off(`sync-attach:${shop}:${progress._id}`, attachCallback);
          this.eventService.off(`sync-cancel:${shop}:${progress._id}`, cancelCallback);
          this.logger.debug(`order sync ${progress._id}:${progress.orders._id} cancelled`);
          progress.state = 'cancelled';
          progress.orders.state = 'cancelled';
          pRetry(() => progress.save());
          return progress;
        }
        lastProgressWithOrders = await this.syncProgressModel.findOne(
          lastProgressWithOrdersQuery,
          {},
          { sort: { 'createdAt': -1} }
        );
        lastOrdersProgress = lastProgressWithOrders && lastProgressWithOrders.orders;
      }

      if (lastOrdersProgress) {
        seedOrdersProgress.sinceId = lastOrdersProgress.lastId;
        seedOrdersProgress.lastId = lastOrdersProgress.lastId;
        seedOrdersProgress.syncedCount = lastOrdersProgress.syncedCount;
        seedOrdersProgress.syncedTransactionsCount = lastOrdersProgress.syncedTransactionsCount;
        seedOrdersProgress.continuedFromPrevious = lastProgressWithOrders._id;
      }
    }

    this.logger.debug('Seed orders progress:', seedOrdersProgress);

    progress.orders = seedOrdersProgress;

    this.logger.debug('Seeded orders progress:', progress.orders);

    await progress.save();
    // The actual sync action:

    const remainingCount = progress.orders.shopifyCount - progress.orders.syncedCount;
    this.logger.debug('remaining count:', remainingCount);
    const itemsPerPage = 250;
    const pages = Math.ceil(remainingCount/itemsPerPage);
    this.logger.debug('pages:', pages);
    let countDown = pages;

    // We want to do this all in a separate detached promise but return the progress immediately:
    Promise.resolve().then(async _ => {
      try {
        for (let i=0; i<pages; i++) {
          if (isCancelled) {
            throw new Error('cancelled');
          }
          const objects = await this.listFromShopify(
            user,
            {
              sync: true,
              failOnSyncError: true,
              since_id: progress.orders.sinceId,
              page: i+1,
              limit: itemsPerPage,
              status: 'any',
            }
          );
          countDown--;
          this.logger.debug(` ${i}|${countDown} / ${pages}`);
          if (!options.includeTransactions) {
            progress.orders.syncedCount += objects.length;
            progress.orders.lastId = objects[objects.length-1].id;
            /* await progress.update({orders: {
              syncedCount: progress.orders.syncedCount,
              lastId: progress.orders.lastId,
            }}); */
            await pRetry(() => progress.save());
          } else {
            for (let j=0; j<objects.length; j++) {
              if (isCancelled) {
                throw new Error('cancelled');
              }
              const transactions = await this.transactionsService.listFromShopify(user, objects[j].id, {sync: true, failOnSyncError: true});
              progress.orders.syncedTransactionsCount += transactions.length;
              progress.orders.syncedCount ++;
              progress.orders.lastId = objects[j].id;
              await pRetry(() => progress.save());
            }
          }
        }
        progress.orders.state = 'success';
      } catch (error) {
        if (error.message === 'cancelled') {
          this.logger.debug(`order sync ${progress._id}:${progress.orders._id} cancelled`);
          progress.state = 'cancelled';
          progress.orders.state = 'cancelled';
        } else {
          progress.orders.state = 'failed';
          progress.orders.error = error.message;
          progress.lastError = `orders:${error.message}`;
          this.logger.error(`order sync ${progress._id}:${progress.orders._id} error:`, error.message);
        }
      }
      if (!progress.options.includeProducts) {
        progress.state = progress.orders.state;
      } else if (progress.products && progress.products.state !== 'running') {
        if (progress.products.state === 'success' && progress.orders.state === 'success') {
          progress.state = 'success';
        } else if (progress.products.state === 'cancelled' || progress.orders.state === 'cancelled') {
          progress.state = 'cancelled';
        } else {
          progress.state = 'failed';
        }
      }
      this.eventService.off(`sync-attach:${shop}:${progress._id}`, attachCallback);
      this.eventService.off(`sync-cancel:${shop}:${progress._id}`, cancelCallback);
      await pRetry(() => progress.save());
    });

    return progress;
  }
}
