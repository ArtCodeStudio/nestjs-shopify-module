import { ISyncOptions } from './sync-progress-options';
import { IOrderSyncProgress } from './sync-progress-order';
import { IProductSyncProgress } from './sync-progress-product';

export interface ISyncProgress {
  shop: String,
  options: ISyncOptions,
  orders?: IOrderSyncProgress,
  products?: IProductSyncProgress,
  createdAt: Date,
  updatedAt: Date,
  state: 'running' | 'failed' | 'canceled' | 'success';
  lastError: string | null,
}
