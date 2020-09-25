import { Inject, Injectable } from '@nestjs/common';
import { Transactions, Options } from 'shopify-admin-api';
import { IShopifyConnect } from '../../../auth/interfaces';
import { Interfaces } from 'shopify-admin-api';
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

@Injectable()
export class TransactionsService extends ShopifyApiChildCountableService<
Interfaces.Transaction,
Transactions,
IShopifySyncTransactionCountOptions,
IShopifySyncTransactionGetOptions,
IShopifySyncTransactionListOptions
>
{

  resourceName = 'transactions';
  subResourceNames = [];

  constructor(
    @Inject('TransactionModelToken')
    private readonly transactionModel: (shopName: string) => Model<TransactionDocument>,
    private readonly eventService: EventService,
  ) {
    super(transactionModel, Transactions, eventService);
  }

  public async getFromShopify(
    user: IShopifyConnect,
    order_id: number,
    id: number,
    options: IShopifySyncTransactionGetOptions = {},
  ): Promise<Interfaces.Transaction|null> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    const syncToDb = options && options.syncToDb;
    return transactions.get(order_id, id)
    .then(async (transaction) => {
      return this.updateOrCreateInApp(user, 'id', transaction, syncToDb)
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
