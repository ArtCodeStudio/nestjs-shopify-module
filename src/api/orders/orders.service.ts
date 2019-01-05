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
import { IOrderSyncProgress, OrderSyncProgressDocument } from '../../sync/sync-progress.schema';
import { TransactionsService } from './transactions/transactions.service';


export interface OrderListOptions extends Options.OrderListOptions {
  sync?: boolean;
}

export interface OrderCountOptions extends Options.OrderCountOptions {
}

export interface OrderSyncOptions {
  resync: boolean,
  includeTransactions: boolean,
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject('OrderModelToken')
    private readonly orderModel: (shopName: string) => Model<OrderDocument>,
    @Inject('OrderSyncProgressModelToken')
    private readonly orderSyncProgressModel: (shopName: string) => Model<OrderSyncProgressDocument>,
    protected readonly eventService: EventService,
    private readonly transactionsService: TransactionsService,
  ) {}

  logger = new DebugService(`shopify:${this.constructor.name}`);

  public async getFromShopify(user: IShopifyConnect, id: number, sync?: boolean): Promise<Order> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const res = await orders.get(id);
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
    return await orders.count(options);
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
    const res = await orders.list(options);
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
    const count = await orders.count(options);
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
    orders.count(options).then(count => {
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

  async listSyncProgress(user: IShopifyConnect): Promise<IOrderSyncProgress[]> {
    // Mongoose order sync progress model
    const orderSyncProgressModel = this.orderSyncProgressModel(user.shop.myshopify_domain);
    return orderSyncProgressModel.find().lean();
  }

  async getLastSyncProgress(user: IShopifyConnect): Promise<IOrderSyncProgress | null> {
    // Mongoose order sync progress model
    const orderSyncProgressModel = this.orderSyncProgressModel(user.shop.myshopify_domain);
    return await orderSyncProgressModel.findOne(
      {},
      {},
      { sort: { 'createdAt': -1} }
    )
    .lean();
  }

  async startSync(user: IShopifyConnect, options: OrderSyncOptions) {
    // Continue the previous sync by default (don't resync completely)
    options = options || { resync: false, includeTransactions: false };
    this.logger.debug(`startSync(myShopifyDomain=${user.shop.myshopify_domain}, resync=${options.resync})`);
    // Shopify orders model
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    // Mongoose order sync progress model
    const orderSyncProgressModel = this.orderSyncProgressModel(user.shop.myshopify_domain);

    const now = new Date();

    // Get the last sync progress (if it exists)
    let lastProgress: OrderSyncProgressDocument = await orderSyncProgressModel.findOne(
      {},
      {},
      { sort: { 'createdAt': -1} }
    );

    if (lastProgress && lastProgress.state === 'running') {
      this.logger.debug(`lastProgress exists`);
      const millisecondsSinceLastUpdate = now.valueOf() - lastProgress.updatedAt.valueOf();
      const fiveMinutes = 5 * 60 * 1000;
      // If last progress was not updated in the last 5 minutes, consider it as failed
      if (millisecondsSinceLastUpdate > fiveMinutes) {
        lastProgress.state = 'failure';
        lastProgress.error = 'sync timed out';
        lastProgress.updatedAt = now;
        lastProgress.save();
        this.eventService.emit(`sync:order`, lastProgress);
      } else {
        this.eventService.emit(`sync:order`, lastProgress);
        return lastProgress;
      }
    }

    // If we continue a previous sync progress, make sure that we take the one which had transactions included
    if (options.includeTransactions && lastProgress && !lastProgress.includeTransactions) {
      lastProgress = await orderSyncProgressModel.findOne(
        { includeTransactions: true },
        {},
        { sort: { 'createdAt': -1} }
      );
    }

    const progress: OrderSyncProgressDocument = await orderSyncProgressModel.create({
      createdAt: now,
      updatedAt: now,
      sinceId: !options.resync && lastProgress && lastProgress.lastId || 0,
      lastId: !options.resync && lastProgress && lastProgress.lastId || null,
      includeTransactions: options.includeTransactions,
      syncedCount: !options.resync && lastProgress && lastProgress.syncedCount || 0,
      shopifyCount: await orders.count({status: 'any'}),
      state: 'running',
      error: null,
    });
    this.logger.debug(`emit new sync event`);
    this.eventService.emit(`sync:order`, progress);

    const remainingCount = progress.shopifyCount - progress.syncedCount;
    const itemsPerPage = 250;
    const pages = Math.ceil(remainingCount/itemsPerPage);
    let countDown = pages;
    let q = new PQueue({ concurrency: 1});
    Promise.all(Array(pages).fill(0).map(
      (x, i) => q.add(() => this.listFromShopify(
          user,
          {
            sync: true,
            since_id: progress.sinceId,
            page: i+1,
            limit: itemsPerPage,
            status: 'any',
          }
        )
        .then(objects => {
          if (!options.includeTransactions) {
            countDown--;
            this.logger.debug(` ${i}|${countDown} / ${pages}`);
            progress.syncedCount += objects.length;
            progress.lastId = objects[objects.length-1].id;
            progress.updatedAt = new Date();
            progress.save();
            this.eventService.emit(`sync:order`, progress);
          } else {
            return Promise.all(objects.map(obj =>
              this.transactionsService.listFromShopify(user, obj.id, {sync: true})
            ))
            .then(_ => {
              countDown--;
              this.logger.debug(` ${i}|${countDown} / ${pages}`);
              progress.syncedCount += objects.length;
              progress.lastId = objects[objects.length-1].id;
              progress.updatedAt = new Date();
              progress.save();
              this.eventService.emit(`sync:order`, progress);
            });
          }
        })
      )
    ))
    .then( _ => {
      progress.state = 'success';
      progress.updatedAt = new Date();
      this.eventService.emit(`sync:order`, progress);
    });
    return progress;
  }
}
