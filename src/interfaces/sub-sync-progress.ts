import { Schema } from 'mongoose';

export interface ISubSyncProgress {
  /**
   * An info text to show on sync progress in fronted
   */
  info: string;
  shop: string;
  shopifyCount: number;
  syncedCount: number;
  sinceId: number;
  lastId: number;
  createdAt: Date;
  updatedAt: Date;
  error: string | null;
  state: 'starting' | 'running' | 'failed' | 'cancelling' | 'cancelled' | 'success';
  continuedFromPrevious?: Schema.Types.ObjectId;
}

export interface IOrderSyncProgress extends ISubSyncProgress {
  includeTransactions: boolean;
  syncedTransactionsCount: number;
}