import { Inject, Injectable } from '@nestjs/common';
import { Orders, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Order } from 'shopify-prime/models';
import { OrderDocument } from '../interfaces/order.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('OrderModelToken')
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  public async get(user: IShopifyConnect, id: number) {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    const order = await orders.get(id);
    if (order) {
      const dbOrder = new this.orderModel(order);
      console.log('saving order', await this.orderModel.update({id: id}, dbOrder, {upsert: true}).exec());
    }
    return order;
  }

  public async count(user: IShopifyConnect, options?: Options.OrderListOptions): Promise<number> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    return await orders.count(options);
  }
  public async list(user: IShopifyConnect, options?: Options.OrderListOptions): Promise<Order[]> {
    const orders = new Orders(user.myshopify_domain, user.accessToken);
    return await orders.list(options);
  }
  /**
   * Gets a list of all of the shop's orders.
   * @param options Options for filtering the results.
   */
  public async listAll(user: IShopifyConnect, options?: Options.OrderListOptions): Promise<Order[]> {
    const orders = new Orders(user.myshopify_domain, user.accessToken)
    const count = await orders.count(options);
    const itemsPerPage = 250;
    const pages = Math.ceil(count/itemsPerPage);
    return await Promise.all(Array(pages).fill(0).map((x, i) => orders.list({...options, page: i+1, limit: itemsPerPage})))
    .then(results => {
      return [].concat.apply([], results);
    })
  }

  public async sync(user: IShopifyConnect) {

  }
}
