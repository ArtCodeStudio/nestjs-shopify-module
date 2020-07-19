import { ISyncOptions } from './options';
import { Options } from 'shopify-admin-api';
export interface RootList<ShopifyObjectType, ListOptions extends ISyncOptions & Options.BasicListOptions = ISyncOptions & Options.BasicListOptions> {
  list(options: ListOptions): Promise<Partial<ShopifyObjectType>[]>;
}