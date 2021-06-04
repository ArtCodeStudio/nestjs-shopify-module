import { Inject, Injectable } from '@nestjs/common';
import { EventService } from '../../event.service';
import { TransactionsService } from './transactions/transactions.service';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';

// Interfaces
import { Model } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';
import { Orders } from 'shopify-admin-api';
import {
  OrderDocument,
  IShopifySyncOrderCountOptions,
  IShopifySyncOrderGetOptions,
  IShopifySyncOrderListOptions,
} from '../interfaces';
import {
  SyncProgressDocument,
  IStartSyncOptions,
  OrderSyncProgressDocument,
  Resource,
  ShopifyModuleOptions,
} from '../../interfaces';
import { IListAllCallbackData } from '../../api/interfaces';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { mongooseParallelRetry } from '../../helpers';
import { SHOPIFY_MODULE_OPTIONS } from '../../shopify.constants';

@Injectable()
export class OrdersService extends ShopifyApiRootCountableService<
  Interfaces.Order, // ShopifyObjectType
  Orders, // ShopifyModelClass
  IShopifySyncOrderCountOptions, // CountOptions
  IShopifySyncOrderGetOptions, // GetOptions
  IShopifySyncOrderListOptions, // ListOptions
  OrderDocument // DatabaseDocumentType
> {
  resourceName: Resource = 'orders';
  subResourceNames: Resource[] = ['transactions'];

  constructor(
    @Inject('OrderModelToken')
    private readonly orderModel: (shopName: string) => Model<OrderDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
    private readonly transactionsService: TransactionsService,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    protected readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
    super(
      orderModel,
      Orders,
      eventService,
      syncProgressModel,
      shopifyModuleOptions,
    );
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
    data: IListAllCallbackData<Interfaces.Order>,
  ): Promise<void> {
    const orders = data.data;
    const lastOrder = orders[orders.length - 1];
    if (options.includeTransactions) {
      for (const order of orders) {
        const transactions = await this.transactionsService.listFromShopify(
          shopifyConnect,
          order.id,
          {
            syncToDb: options.syncToDb,
          },
        );
        subProgress.syncedTransactionsCount += transactions.length;
        subProgress.syncedCount++;
        subProgress.lastId = order.id;
        subProgress.info = order.name;
        await mongooseParallelRetry(() => {
          return progress.save();
        });
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
  protected getSyncCountOptions(
    syncOptions: IStartSyncOptions,
  ): IShopifySyncOrderCountOptions {
    this.logger.debug(`getSyncCountOptions: %O`, syncOptions);
    this.logger.debug('status %o:', { status: 'any' });
    return { status: 'any' };
  }
}
