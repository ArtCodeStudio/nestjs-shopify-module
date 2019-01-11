import { Schema } from 'mongoose';

export interface IProductSyncProgress {
  /**
   * A info text to show on sync progress in frontend 
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
  state: 'running' | 'failed' | 'cancelled' | 'success';
  continuedFromPrevious?: Schema.Types.ObjectId;
}