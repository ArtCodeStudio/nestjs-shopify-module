import { Inject, Injectable } from '@nestjs/common';
import { Transactions } from 'shopify-admin-api';
import { IShopifyConnect } from '../../../auth/interfaces';
import { Interfaces } from 'shopify-admin-api';
import {
  TransactionDocument,
  IShopifySyncTransactionCountOptions,
  IShopifySyncTransactionGetOptions,
  IShopifySyncTransactionListOptions,
} from '../../interfaces';
import { ShopifyModuleOptions, Resource } from '../../../interfaces';
import { SHOPIFY_MODULE_OPTIONS } from '../../../shopify.constants';
import { Model } from 'mongoose';
import { getDiff, shopifyRetry } from '../../../helpers';
import { ShopifyApiChildCountableService } from '../../shopify-api-child-countable.service';
import { EventService } from '../../../event.service';

@Injectable()
export class TransactionsService extends ShopifyApiChildCountableService<
Interfaces.Transaction,
Transactions,
IShopifySyncTransactionCountOptions,
IShopifySyncTransactionGetOptions,
IShopifySyncTransactionListOptions
>
{

  resourceName: Resource = 'transactions';
  subResourceNames: Resource[] = [];

  constructor(
    @Inject('TransactionModelToken')
    private readonly transactionModel: (shopName: string) => Model<TransactionDocument>,
    private readonly eventService: EventService,
    @Inject(SHOPIFY_MODULE_OPTIONS) protected readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
    super(transactionModel, Transactions, eventService, shopifyModuleOptions);
  }

  public async getFromShopify(
    user: IShopifyConnect,
    order_id: number,
    id: number,
    options: IShopifySyncTransactionGetOptions = {},
  ): Promise<Interfaces.Transaction|null> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    const syncToDb = options && options.syncToDb;

    const transaction = await shopifyRetry(() => {
      return transactions.get(order_id, id);
    });

    if (this.shopifyModuleOptions.sync.enabled && this.shopifyModuleOptions.sync.autoSyncResources.includes(this.resourceName)) {
      await this.updateOrCreateInApp(user, 'id', transaction, syncToDb)
    }

    return transaction;
  }

  public async countFromShopify(user: IShopifyConnect, orderId: number): Promise<number> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    return await transactions.count(orderId);
  }

  public async diffSynced(user: IShopifyConnect, order_id: number): Promise<any> {
    const fromDb = await this.listFromDb(user);
    const fromShopify = await this.listFromShopify(user, order_id);
    let dbObj;
    return fromShopify.map((obj) =>
      dbObj = fromDb.find((x) => {
        // FIXME: should not be necessary to use "toString", as both should be integers. Something must be wrong in the transactionModel definition (Document, DocumentType)
        return x.id.toString() === obj.id.toString();
      }) && {
        [obj.id]: getDiff(obj, dbObj)
        .filter((x) => {
          return x.operation !== 'update' && !x.path.endsWith('._id');
        }),
      },
    )
    .reduce((a, c) => ({...a, ...c}), {});
  }
}
