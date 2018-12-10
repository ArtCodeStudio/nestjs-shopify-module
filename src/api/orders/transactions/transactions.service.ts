import { Inject, Injectable } from '@nestjs/common';
import { Transactions, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../../auth/interfaces/connect';
import { Transaction } from 'shopify-prime/models';
import { TransactionDocument } from '../../interfaces/transaction.schema';
import { Model, Types } from 'mongoose';

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
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  public async get(user: IShopifyConnect, orderId: number, id: number, options?: TransactionBaseOptions, sync: boolean = true) {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    const transaction = await transactions.get(orderId, id, options);
    if (transaction && sync) {
      //const dbTransaction = new this.transactionModel(transaction);
      //console.log('saving transaction', await this.transactionModel.update({id: id}, dbTransaction, {upsert: true}).exec());
      console.log('saving transaction', await this.transactionModel.findOneAndUpdate({id: transaction.id}, transaction, {upsert: true}));
    }
    return transaction;
  }

  public async count(user: IShopifyConnect, orderId: number): Promise<number> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    return await transactions.count(orderId);
  }
  public async list(user: IShopifyConnect, orderId: number, options?: TransactionListOptions): Promise<Transaction[]> {
    const transactions = new Transactions(user.myshopify_domain, user.accessToken);
    const data = await transactions.list(orderId, options);
    if (options && options.sync) {
      // TODO: how to use bulk methods?
      data.forEach(async transaction => {
        console.log('saving transaction', await this.transactionModel.findOneAndUpdate({id: transaction.id}, transaction, {upsert: true}));
      });
    }
    return data;
  }

  public async sync(user: IShopifyConnect) {

  }
}
