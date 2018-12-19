import { Inject, Injectable } from '@nestjs/common';
import { Orders, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Order } from 'shopify-prime/models';
import { OrderDocument } from '../interfaces/order.schema';
import { Model, Types } from 'mongoose';
import { getDiff } from '../../helpers/diff';
import { Readable } from 'stream';


export interface OrderListOptions extends Options.OrderListOptions {
  sync?: boolean;
}

export interface OrderCountOptions extends Options.OrderCountOptions {
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject('OrderModelToken')
    private readonly orderModel: (shopName: string) => Model<OrderDocument>,
  ) {}

  public async getFromShopify(user: IShopifyConnect, id: number, sync?: boolean) {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const res = await orders.get(id);
    if (sync) {
      await this.saveOne(user, res);
    }
    return res;
  }

  public async getFromDb(user: IShopifyConnect, id: number) {
    return await this.orderModel(user.shop.myshopify_domain).find({id});
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
    return await this.orderModel(user.shop.myshopify_domain).find({});
  }

  public async diffSynced(user: IShopifyConnect): Promise<any[]> {
    const fromDb = await this.listFromDb(user);
    const fromShopify = await this.listAllFromShopify(user);
    let dbObj;
    return fromShopify.map(obj => (dbObj = fromDb.find(x => x.id === obj.id)) && getDiff(obj, dbObj).filter(x=>x.operation!=='update'))
    .filter(x=>!!x && x.length>0);
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
      stream.push('[\n')
      Promise.all(Array(pages).fill(0).map(
        (x, i) => this.listFromShopify(user, {...options, page: i+1, limit: itemsPerPage})
          .then(objects => {
            countDown--;
            objects.forEach((obj, i) => {
              stream.push(JSON.stringify([obj], null, 2).slice(2, -2) + (countDown > 0 || (i!==objects.length-1) ? ',': '\n]'));
            });
          })
      ))
      .then(_ => stream.push(null));
    });
    return stream;
  }
}
