import { Schema } from 'mongoose';

export interface IProductSyncProgress {
  shop: string,
  shopifyCount: number,
  syncedCount: number,
  sinceId: number,
  lastId: number,
  createdAt: Date,
  updatedAt: Date,
  error: string | null,
  state: 'running' | 'failed' | 'canceled' | 'success';
  continuedFromPrevious?: Schema.Types.ObjectId,
}