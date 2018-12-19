import { Inject, Injectable } from '@nestjs/common';
import { Orders, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Order } from 'shopify-prime/models';
import { OrderDocument } from '../interfaces/order.schema';
import { Model, Types } from 'mongoose';

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

  public async getFromShopify(user: IShopifyConnect, id: number, sync?: true) {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const res = await orders.get(id);
    if (sync) {
      await this.saveOne(user, res);
    }
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
      await this.saveMany(user, res);
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

  /**
   * Gets a list of all of the shop's orders.
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(user: IShopifyConnect, options?: OrderListOptions): Promise<Order[]> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const sync = options && options.sync;
    if (sync) {
      delete options.sync;
    }
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
}
