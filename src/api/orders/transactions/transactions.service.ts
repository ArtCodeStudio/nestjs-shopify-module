import { Inject, Injectable } from '@nestjs/common';
import { Transactions, Options } from 'shopify-admin-api';
import { IShopifyConnect } from '../../../auth/interfaces';
import { Transaction } from 'shopify-admin-api/dist/models';
import {
  TransactionDocument,
  IAppTransactionCountOptions,
  IAppTransactionGetOptions,
  IAppTransactionListOptions,
  IShopifySyncTransactionCountOptions,
  IShopifySyncTransactionGetOptions,
  IShopifySyncTransactionListOptions,
} from '../../interfaces';
import { ShopifyModuleOptions } from '../../../interfaces';
import { Model } from 'mongoose';
import { getDiff } from '../../../helpers/diff';
import { ShopifyApiChildCountableService } from '../../shopify-api-child-countable.service';
import { EventService } from '../../../event.service';
import { ElasticsearchService } from '../../../elasticsearch.service';
import { SwiftypeService } from '../../../swiftype.service';

@Injectable()
export class TransactionsService extends ShopifyApiChildCountableService<
Transaction,
Transactions,
IShopifySyncTransactionCountOptions,
IShopifySyncTransactionGetOptions,
IShopifySyncTransactionListOptions
>
{

  resourceName = 'transactions';
  subResourceNames = [];

  constructor(
    protected readonly esService: ElasticsearchService,
    @Inject('TransactionModelToken')
    private readonly transactionModel: (shopName: string) => Model<TransactionDocument>,
    protected readonly swiftypeService: SwiftypeService,
    private readonly eventService: EventService,
  ) {
    super(esService, transactionModel, swiftypeService, Transactions, eventService);
  }

  public async getFromShopify(
    user: IShopifyConnect,
    order_id: number,
    id: number,
    options: IShopifySyncTransactionGetOptions = {},
  ): Promise<Transaction|null> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    const syncToDb = options && options.syncToDb;
    const syncToSwiftype = options && options.syncToSwiftype;
    const syncToEs = options && options.syncToEs;
    return transactions.get(order_id, id)
    .then(async (transaction) => {
      return this.updateOrCreateInApp(user, 'id', transaction, syncToDb, syncToSwiftype, syncToEs)
      .then((_) => {
        return transaction;
      });
    });
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
        return x.id === obj.id;
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
