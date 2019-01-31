import { Inject, Injectable } from '@nestjs/common';
import { EventService } from '../../event.service';
import { TransactionsService } from './transactions/transactions.service';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';
import { ElasticsearchService } from '../../elasticsearch.service';
import { SwiftypeService } from '../../swiftype.service';

// Interfaces
import { Model } from 'mongoose';
import { Order } from 'shopify-prime/models';
import { Orders } from 'shopify-prime';
import {
  OrderDocument,
  IShopifySyncOrderCountOptions,
  IShopifySyncOrderGetOptions,
  IShopifySyncOrderListOptions,
  IAppOrderCountOptions,
  IAppOrderGetOptions,
  IAppOrderListOptions,
} from '../interfaces';
import { SyncProgressDocument,
  IStartSyncOptions,
  OrderSyncProgressDocument,
} from '../../interfaces';
import { IListAllCallbackData } from '../../api/interfaces';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { mongooseParallelRetry } from '../../helpers';

@Injectable()
export class OrdersService extends ShopifyApiRootCountableService<
  Order, // ShopifyObjectType
  Orders, // ShopifyModelClass
  IShopifySyncOrderCountOptions, // CountOptions
  IShopifySyncOrderGetOptions, // GetOptions
  IShopifySyncOrderListOptions, // ListOptions
  OrderDocument // DatabaseDocumentType
  > {

  resourceName = 'orders';
  subResourceNames = [];

  constructor(
    protected readonly esService: ElasticsearchService,
    @Inject('OrderModelToken')
    private readonly orderModel: (shopName: string) => Model<OrderDocument>,
    protected readonly swiftypeService: SwiftypeService,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
    private readonly transactionsService: TransactionsService,
  ) {
    super(esService, orderModel, swiftypeService, Orders, eventService, syncProgressModel);
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
    progress: SyncProgressDocument,
    subProgress: OrderSyncProgressDocument,
    options: IStartSyncOptions,
    data: IListAllCallbackData<Order>,
  ): Promise<void> {
    const orders = data.data;
    const lastOrder = orders[orders.length - 1];
    if (options.includeTransactions) {
      for (const order of orders) {
        await this.transactionsService.listFromShopify(shopifyConnect, order.id, {
          syncToDb: options.syncToDb,
          syncToSwiftype: options.syncToSwiftype,
          syncToEs: options.syncToEs,
        });
        subProgress.syncedCount ++;
        subProgress.lastId = order.id;
        subProgress.info = order.name;
        await mongooseParallelRetry(() => {
          return progress.save();
        })
      }
    } else {
      subProgress.syncedCount += orders.length;
      subProgress.lastId = lastOrder.id;
      subProgress.info = lastOrder.name;
    }
  }

  /**
   *
   * @param syncOptions
   */
  protected getSyncCountOptions(syncOptions: IStartSyncOptions): IShopifySyncOrderCountOptions {
    this.logger.debug(`getSyncCountOptions`, syncOptions);
    this.logger.debug({status: 'any'});
    return { status: 'any'};
  }
}
