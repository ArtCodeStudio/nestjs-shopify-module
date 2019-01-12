import { ISyncOptions } from './sync-options';
import { ISubSyncProgress, IOrderSyncProgress } from './sub-sync-progress';

export interface ISyncProgress {
  shop: String,
  options: ISyncOptions,
  orders?: IOrderSyncProgress,
  products?: ISubSyncProgress,
  createdAt: Date,
  updatedAt: Date,
  state: 'running' | 'failed' | 'cancelled' | 'success';
  lastError: string | null,
}
