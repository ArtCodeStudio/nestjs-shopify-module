import { SyncOptions } from './sync-options';
import { Options } from 'shopify-prime';
export interface ChildList<ShopifyObjectType, ListOptions extends SyncOptions & Options.BasicListOptions = SyncOptions & Options.BasicListOptions> {
  list(parentId: number, options: ListOptions): Promise<ShopifyObjectType[]>;
}