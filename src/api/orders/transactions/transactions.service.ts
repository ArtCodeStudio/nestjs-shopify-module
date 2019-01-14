import { Inject, Injectable } from '@nestjs/common';
import { Transactions, Options } from 'shopify-prime';
import { IShopifyConnect } from '../../../auth/interfaces';
import { Transaction } from 'shopify-prime/models';
import { TransactionDocument } from '../../interfaces';
import { ShopifyModuleOptions } from '../../../interfaces';
import { Model } from 'mongoose';
import { getDiff } from '../../helpers/diff';
import { ShopifyApiChildCountableService } from '../../shopify-api-child-countable.service';
import { EventService } from '../../../event.service';
import { ElasticsearchService } from '../../../elasticsearch.service';

export interface TransactionBaseOptions extends Options.TransactionBaseOptions {
  sync?: boolean;
}

export interface TransactionListOptions extends Options.TransactionListOptions {
  sync?: boolean;
  failOnSyncError?: boolean;
}

export interface TransactionCountOptions extends Options.TransactionBaseOptions {
  sync?: boolean;
}

export interface TransactionGetOptions extends Options.TransactionBaseOptions {
  sync?: boolean;
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
    private readonly eventService: EventService
  ) {
    super(esService, transactionModel, Transactions, eventService);
  }

  public async getFromShopify(user: IShopifyConnect, order_id: number, id: number, options?: TransactionBaseOptions): Promise<Transaction|null> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    const res = await transactions.get(order_id, id);
    if (options && options.sync) {
      await this.updateOrCreateInDb(user, 'id', res);
    }
    return res;
  }

  public async countFromShopify(user: IShopifyConnect, orderId: number): Promise<number> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    return await transactions.count(orderId);
  }

  public async diffSynced(user: IShopifyConnect, order_id: number): Promise<any> {
    const fromDb = await this.listFromDb(user);
    const fromShopify = await this.listFromShopify(user, order_id);
    console.log('from DB', fromDb.length);
    console.log('from Shopify', fromShopify.length);
    let dbObj;
    return fromShopify.map(obj => (dbObj = fromDb.find(x => x.id === obj.id)) && {[obj.id]: getDiff(obj, dbObj).filter(x=>x.operation!=='update' && !x.path.endsWith('._id'))})
    .reduce((a,c)=>({...a, ...c}), {})
  }
}
