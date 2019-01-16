import { SyncOptions } from './options';
import { Options } from 'shopify-prime';
export interface RootList<ShopifyObjectType, ListOptions extends SyncOptions & Options.BasicListOptions = SyncOptions & Options.BasicListOptions> {
  list(options: ListOptions): Promise<ShopifyObjectType[]>;
}