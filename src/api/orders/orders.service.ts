import { Inject, Injectable } from '@nestjs/common';
import { Orders, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Order } from 'shopify-prime/models';
import { OrderDocument } from '../interfaces/order.schema';
import { Model, Types } from 'mongoose';
import { getDiff } from '../../helpers/diff';
import { Readable } from 'stream';
import * as PQueue from 'p-queue';
import { DebugService } from '../../debug.service';
import { EventService } from '../../event.service';
import { IOrderSyncProgress, OrderSyncProgressDocument, ISyncProgress, SyncProgressDocument } from '../../sync/sync-progress.schema';
import { TransactionsService } from './transactions/transactions.service';
import * as pRetry from 'p-retry';


export interface OrderListOptions extends Options.OrderListOptions {
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
export class OrdersService {
  constructor(
    @Inject('OrderModelToken')
    private readonly orderModel: (shopName: string) => Model<OrderDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
    private readonly transactionsService: TransactionsService,
  ) {}

  logger = new DebugService(`shopify:${this.constructor.name}`);

  public async getFromShopify(user: IShopifyConnect, id: number, sync?: boolean): Promise<Order> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const res = await pRetry(() => orders.get(id));
    if (sync) {
      await this.saveOne(user, res);
    }
    return res;
  }

  public async getFromDb(user: IShopifyConnect, id: number) {
    return await this.orderModel(user.shop.myshopify_domain).findOne({id}).select('-_id -__v').lean();
  }

  public async countFromShopify(user: IShopifyConnect, options?: Options.OrderCountOptions): Promise<number> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    return await pRetry(() => orders.count(options));
  }
  public async countFromDb(user: IShopifyConnect, options?: Options.OrderCountOptions): Promise<number> {
    return await this.orderModel(user.shop.myshopify_domain).count({});
  }

  public async listFromShopify(user: IShopifyConnect, options?: OrderListOptions): Promise<Order[]> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    let sync = options && options.sync;
    if (sync) {
      delete options.sync;
    }
    const res = await pRetry(() => orders.list(options));
    if (sync) {
      try {
        await this.saveMany(user, res);
      } catch (e) {
        console.log(e);
      }
    }
    return res;
  }

  public async saveMany(user: IShopifyConnect, orders: Order[]) {
    const model = this.orderModel(user.shop.myshopify_domain);
    return orders.map(async (order: Order) => await model.findOneAndUpdate({id: order.id}, order, {upsert: true}));
  }

  public async saveOne(user: IShopifyConnect, order: Order) {
    const model = this.orderModel(user.shop.myshopify_domain);
    return await model.findOneAndUpdate({id: order.id}, order);
  }

  public async listFromDb(user: IShopifyConnect): Promise<Order[]> {
    return await this.orderModel(user.shop.myshopify_domain).find({}).select('-_id -__v').lean();
  }

  public async diffSynced(user: IShopifyConnect): Promise<any> {
    const fromDb = await this.listFromDb(user);
    const fromShopify = await this.listAllFromShopify(user, {status: 'any'});
    console.log('from DB', fromDb.length);
    console.log('from Shopify', fromShopify.length);
    let dbObj;
    return fromShopify.map(obj => (dbObj = fromDb.find(x => x.id === obj.id)) && {[obj.id]: getDiff(obj, dbObj).filter(x=>x.operation!=='update' && !x.path.endsWith('._id'))})
    .reduce((a,c)=>({...a, ...c}), {})
  }

  /**
   * Gets a list of all of the shop's orders.
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(user: IShopifyConnect, options?: OrderListOptions): Promise<Order[]> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const count = await pRetry(() => orders.count(options));
    const itemsPerPage = 250;
    const pages = Math.ceil(count/itemsPerPage);
    return await Promise.all(
      Array(pages).fill(0).map(
        (x, i) => this.listFromShopify(user, {...options, page: i+1, limit: itemsPerPage})
      )
    )
    .then(results => {
      return [].concat.apply([], results);
    })
  }

  /**
   * Gets a list of all of the shop's orders.
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyStream(user: IShopifyConnect, options?: OrderListOptions): Readable {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const stream = new Readable({objectMode: true, read: s=>s});
    pRetry(() => orders.count(options)).then(count => {
      const itemsPerPage = 250;
      const pages = Math.ceil(count/itemsPerPage);
      let countDown = pages;
      let q = new PQueue({ concurrency: 1});
      stream.push('[\n')
      Promise.all(Array(pages).fill(0).map(
        (x, i) => q.add(() => this.listFromShopify(user, {...options, page: i+1, limit: itemsPerPage})
          .then(objects => {
            countDown--;
            this.logger.debug(`listAll ${i}|${countDown} / ${pages}`);
            objects.forEach((obj, i) => {
              stream.push(JSON.stringify([obj], null, 2).slice(2, -2) + (countDown > 0 || (i!==objects.length-1) ? ',': '\n]'));
            });
          })
        )
      ))
      .then(_ => stream.push(null));
    });
    return stream;
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

  async startSync(user: IShopifyConnect, options?: OrderSyncOptions, progress?: SyncProgressDocument): Promise<SyncProgressDocument> {
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

    // Get the last sync progress (if it exists)
    const lastProgress: SyncProgressDocument = await this.syncProgressModel.findOne(
      {
        shop: user.shop.myshopify_domain,
      },
      {},
      { sort: { 'createdAt': -1} }
    );

    this.logger.debug('lastProgress:', lastProgress);

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
        this.logger.debug('check if last progress is still running');
        const lastProgressRunning = await new Promise(resolve => {
          this.eventService.once(`sync-pong:${lastProgress._id}`, () => resolve(true));
          this.eventService.emit(`sync-ping:${lastProgress._id}`);
          setTimeout(() => resolve(false), 5000);
        });
        if (!lastProgressRunning) {
          this.logger.debug('last progress has failed');
          lastProgress.state = 'failure';
          lastProgress.lastError = 'sync timed out';
          await lastProgress.save();
        } else {
          // If the last progress is still running and includes orders and all options we need, we just return it, without starting a new one.
          // If the running progress does not include orders and the option `attachToExisting` is set, we include the order sync in the running progress.
          // If the options of the running progress and the sync we want to start are incompatible, we throw a `sync in progress` error.
          if (lastProgress.options.includeOrders) {
            if (options.resync && !lastProgress.options.resync) {
              if (options.cancelExisting) {
                this.eventService.emit(`sync-cancel:${lastProgress._id}`);
              } else {
                throw new Error('sync in progress');
              }
            }
            if (options.includeTransactions && !lastProgress.options.includeTransactions) {
              if (options.cancelExisting) {
                this.eventService.emit(`sync-cancel:${lastProgress._id}`);
              } else {
                throw new Error('sync in progress');
              }
            } else {
              // Options are compatible with already running sync. We just re-emit the events and return the running progress.
              this.eventService.emit(`sync`, lastProgress);
              this.eventService.emit(`sync:orders`, lastProgress.orders);
              this.logger.debug('return last running progress', lastProgress);
              return lastProgress;
            }
          } else if (options.attachToExisting) {
            this.logger.debug('attach order sync to lastProgress:', lastProgress);
            progress = lastProgress;
            this.eventService.emit(`sync-attach:${progress._id}`, 'orders');
            progress.options.includeOrders = true;
            await progress.save();
          } else {
            if (options.cancelExisting) {
              this.eventService.emit(`sync-cancel:${lastProgress._id}`);
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
    }

    this.logger.debug('SyncProgress:', progress);

    // Register an event handler for as long as this sync progress is running, used for checking if the sync is still running
    const pingCallback = () => this.eventService.emit(`sync-pong:${progress._id}`);
    this.eventService.on(`sync-ping:${progress._id}`, pingCallback);

    const attachCallback = (resource: string) => {
      if (resource === 'products') {
        progress.options.includeProducts = true;
      }
    }
    this.eventService.on(`sync-attach:${progress._id}`, attachCallback);

    const cancelCallback = () => {
      isCancelled = true;
    };
    this.eventService.once(`sync-cancel:${progress._id}`, cancelCallback);

    if (isCancelled) {
      this.eventService.off(`sync-ping:${progress._id}`, pingCallback);
      this.eventService.off(`sync-attach:${progress._id}`, attachCallback);
      this.eventService.off(`sync-cancel:${progress._id}`, cancelCallback);
      progress.state = 'canceled';
      progress.save();
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
          this.eventService.off(`sync-ping:${progress._id}`, pingCallback);
          this.eventService.off(`sync-attach:${progress._id}`, attachCallback);
          this.eventService.off(`sync-cancel:${progress._id}`, cancelCallback);
          progress.state = 'canceled';
          progress.save();
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
            await progress.save();
          } else {
            for (let j=0; j<objects.length; j++) {
              if (isCancelled) {
                throw new Error('cancelled');
              }
              const transactions = await this.transactionsService.listFromShopify(user, objects[j].id, {sync: true});
              progress.orders.syncedTransactionsCount += transactions.length;
              progress.orders.syncedCount ++;
              progress.orders.lastId = objects[j].id;
              await progress.save();
            }
          }
        }
        progress.orders.state = 'success';
      } catch (error) {
        progress.orders.state = 'failed';
        progress.orders.error = error.message;
        progress.lastError = `orders:${error.message}`;
        this.logger.debug('order sync error:', error);
      }
      if (!progress.options.includeProducts) {
        progress.state = progress.orders.state;
      } else if (progress.products && progress.products.state !== 'running') {
        if (progress.products.state === 'success' && progress.orders.state === 'success') {
          progress.state = 'success';
        } else {
          progress.state = 'failed';
        }
      }
      this.eventService.off(`sync-ping:${progress._id}`, pingCallback);
      this.eventService.off(`sync-attach:${progress._id}`, attachCallback);
      this.eventService.off(`sync-cancel:${progress._id}`, cancelCallback);
      await progress.save();
    });

    return progress;
  }
}
