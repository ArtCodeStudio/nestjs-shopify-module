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
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  public async get(user: IShopifyConnect, id: number, sync: boolean = true) {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const order = await orders.get(id);
    if (order && sync) {
      //const dbOrder = new this.orderModel(order);
      //console.log('saving order', await this.orderModel.update({id: id}, dbOrder, {upsert: true}).exec());
      console.log('saving order', await this.orderModel.findOneAndUpdate({id: order.id}, order, {upsert: true}));
    }
    return order;
  }

  public async count(user: IShopifyConnect, options?: Options.OrderCountOptions): Promise<number> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    return await orders.count(options);
  }
  public async list(user: IShopifyConnect, options?: OrderListOptions): Promise<Order[]> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const data = await orders.list(options);
    if (options && options.sync) {
      // TODO: how to use bulk methods?
      data.forEach(async order => {
        console.log('saving order', await this.orderModel.findOneAndUpdate({id: order.id}, order, {upsert: true}));
      });
    }
    return data;
  }
  /**
   * Gets a list of all of the shop's orders.
   * @param options Options for filtering the results.
   */
  public async listAll(user: IShopifyConnect, options?: OrderListOptions): Promise<Order[]> {
    const orders = new Orders(user.myshopify_domain, user.accessToken)
    const count = await orders.count(options);
    const itemsPerPage = 250;
    const pages = Math.ceil(count/itemsPerPage);
    return await Promise.all(
      Array(pages).fill(0).map(
        (x, i) => this.list(user, {...options, page: i+1, limit: itemsPerPage})
      )
    )
    .then(results => {
      return [].concat.apply([], results);
    })
  }

  public async sync(user: IShopifyConnect) {

  }
}
