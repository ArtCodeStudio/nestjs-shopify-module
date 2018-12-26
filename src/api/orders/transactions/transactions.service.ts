import { Inject, Injectable } from '@nestjs/common';
import { Transactions, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../../auth/interfaces/connect';
import { Transaction } from 'shopify-prime/models';
import { TransactionDocument } from '../../interfaces/transaction.schema';
import { Model, Types } from 'mongoose';
import { getDiff } from '../../../helpers/diff';


export interface TransactionBaseOptions extends Options.TransactionBaseOptions {
  sync?: boolean;
}

export interface TransactionListOptions extends Options.TransactionListOptions {
  sync?: boolean;
}

@Injectable()
export class TransactionsService {
  constructor(
    @Inject('TransactionModelToken')
    private readonly transactionModel: (shopName: string) => Model<TransactionDocument>,
  ) {}

  public async getFromShopify(user: IShopifyConnect, order_id: number, id: number, options?: TransactionBaseOptions): Promise<Transaction> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    const res = await transactions.get(order_id, id);
    if (options && options.sync) {
      await this.saveOne(user, res);
    }
    return res;
  }

  public async getFromDb(user: IShopifyConnect, id: number, order_id?: number) {
    return await this.transactionModel(user.shop.myshopify_domain).findOne(order_id?{order_id, id}:{id}).select('-_id -__v').lean();
  }

  public async countFromShopify(user: IShopifyConnect, orderId: number): Promise<number> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    return await transactions.count(orderId);
  }

  public async countFromDb(user: IShopifyConnect, orderId: number): Promise<number> {
    return await this.transactionModel(user.shop.myshopify_domain).count({});

  }

  public async saveMany(user: IShopifyConnect, transactions: Transaction[]) {
    const model = this.transactionModel(user.shop.myshopify_domain);
    return transactions.map(async (transaction: Transaction) => await model.findOneAndUpdate({id: transaction.id}, transaction, {upsert: true}));
  }

  public async saveOne(user: IShopifyConnect, transaction: Transaction) {
    const model = this.transactionModel(user.shop.myshopify_domain);
    return await model.findOneAndUpdate({id: transaction.id}, transaction);
  }

  public async listFromDb(user: IShopifyConnect, order_id?: number): Promise<Transaction[]> {
    return await this.transactionModel(user.shop.myshopify_domain).find(order_id?{order_id}:{}).select('-_id -__v').lean();
  }

  public async listFromShopify(user: IShopifyConnect, order_id: number, options?: TransactionListOptions): Promise<Transaction[]> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    let sync = options && options.sync;
    if (sync) {
      delete options.sync;
    }
    const res = await transactions.list(order_id, options);
    if (sync) {
      try {
        await this.saveMany(user, res);
      } catch (e) {
        console.log(e);
      }
    }
    return res;
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
