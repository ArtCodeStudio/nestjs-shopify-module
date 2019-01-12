import { Inject, Injectable } from '@nestjs/common';
import { Orders, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Order } from 'shopify-prime/models';
import { OrderDocument } from '../interfaces/mongoose/order.schema';
import { Model } from 'mongoose';
import { EventService } from '../../event.service';
import { IListAllCallbackData } from '../../api/interfaces';
import { SyncProgressDocument, ISyncOptions, OrderSyncProgressDocument } from '../../interfaces';
import { TransactionsService } from './transactions/transactions.service';
import { ShopifyApiRootCountableService } from '../api.service';


export interface OrderListOptions extends Options.OrderListOptions {
  sync?: boolean;
  failOnSyncError?: boolean;
}

export interface OrderGetOptions extends Options.FieldOptions {
  sync?: boolean;
}

export interface OrderCountOptions extends Options.OrderCountOptions {
}

@Injectable()
export class OrdersService extends ShopifyApiRootCountableService<
  Order, // ShopifyObjectType
  Orders, // ShopifyModelClass
  OrderCountOptions, // CountOptions
  OrderGetOptions, // GetOptions
  OrderListOptions, // ListOptions
  OrderDocument // DatabaseDocumentType
  > {

  resourceName = 'orders';
  subResourceNames = [];

  constructor(
    @Inject('OrderModelToken')
    private readonly orderModel: (shopName: string) => Model<OrderDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
    private readonly transactionsService: TransactionsService,
  ) {
    super(orderModel, Orders, eventService, syncProgressModel);
  }

  /**
   * Sub-routine to configure the sync.
   * In case of orders we have to check if transactions should be included.
   *
   * @param shopifyConnect 
   * @param subProgress 
   * @param options 
   * @param data 
   */
  protected async syncedDataCallback(
    shopifyConnect: IShopifyConnect,
    subProgress: OrderSyncProgressDocument,
    options: ISyncOptions,
    data: IListAllCallbackData<Order>
  ): Promise<void> {
    const orders = data.data;
    const lastOrder =orders[orders.length-1];
    if (options.includeTransactions) {
      for (let i=0; i<orders.length; i++) {
        await this.transactionsService.listFromShopify(shopifyConnect, lastOrder.id, {sync: true});
      }
    }
    subProgress.syncedCount += orders.length;
    subProgress.lastId = lastOrder.id;
    subProgress.info = lastOrder.name;
  }

  /**
   * 
   * @param syncOptions 
   */
  protected getSyncListOptions(syncOptions: ISyncOptions): OrderListOptions {
    return { status: 'any'};
  }
}
