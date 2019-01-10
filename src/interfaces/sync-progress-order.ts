import { Schema } from 'mongoose';

export interface IOrderSyncProgress {
  shop: string,
  includeTransactions: boolean,
  shopifyCount: number,
  syncedCount: number,
  syncedTransactionsCount: number,
  sinceId: number,
  lastId: number,
  createdAt: Date,
  updatedAt: Date,
  error: string | null,
  state: 'running' | 'failed' | 'cancelled' | 'success';
  continuedFromPrevious?: Schema.Types.ObjectId,
}