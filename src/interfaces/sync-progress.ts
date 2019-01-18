import { IStartSyncOptions } from './sync-options';
import { ISubSyncProgress, IOrderSyncProgress } from './sub-sync-progress';

export interface ISyncProgress {
  shop: string;
  options: IStartSyncOptions;
  orders?: IOrderSyncProgress;
  products?: ISubSyncProgress;
  createdAt: Date;
  updatedAt: Date;
  state: 'running' | 'failed' | 'cancelled' | 'success';
  lastError: string | null;
}
