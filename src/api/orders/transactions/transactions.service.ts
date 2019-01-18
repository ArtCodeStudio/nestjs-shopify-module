import { Inject, Injectable } from '@nestjs/common';
import { Transactions, Options } from 'shopify-prime';
import { IShopifyConnect } from '../../../auth/interfaces';
import { Transaction } from 'shopify-prime/models';
import { TransactionDocument } from '../../interfaces';
import { ShopifyModuleOptions } from '../../../interfaces';
import { Model } from 'mongoose';
import { getDiff } from '../../../helpers/diff';
import { ShopifyApiChildCountableService } from '../../shopify-api-child-countable.service';
import { EventService } from '../../../event.service';
import { ElasticsearchService } from '../../../elasticsearch.service';

export interface TransactionBaseOptions extends Options.TransactionBaseOptions {
  syncToDb?: boolean;
  syncToSearch?: boolean;
}

export interface TransactionListOptions extends Options.TransactionListOptions {
  syncToDb?: boolean;
  syncToSearch?: boolean;
  failOnSyncError?: boolean;
}

export interface TransactionCountOptions extends Options.TransactionBaseOptions {
  syncToDb?: boolean;
  syncToSearch?: boolean;
}

export interface TransactionGetOptions extends Options.TransactionBaseOptions {
  syncToDb?: boolean;
  syncToSearch?: boolean;
}

@Injectable()
export class TransactionsService extends ShopifyApiChildCountableService<
Transaction,
Transactions,
TransactionCountOptions,
TransactionGetOptions,
TransactionListOptions
>
{

  resourceName = 'transactions';
  subResourceNames = [];

  constructor(
    protected readonly esService: ElasticsearchService,
    @Inject('TransactionModelToken')
    private readonly transactionModel: (shopName: string) => Model<TransactionDocument>,
    private readonly eventService: EventService,
  ) {
    super(esService, transactionModel, Transactions, eventService);
  }

  public async getFromShopify(user: IShopifyConnect, order_id: number, id: number, options?: TransactionBaseOptions): Promise<Transaction|null> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    const syncToDb = options && options.syncToDb;
    const syncToSearch = options && options.syncToSearch;
    return transactions.get(order_id, id)
    .then(async (transaction) => {
      return this.updateOrCreateInApp(user, 'id', transaction, syncToDb, syncToSearch)
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
