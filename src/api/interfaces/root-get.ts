import { SyncOptions } from './options';
export interface RootGet<ShopifyObjectType, GetOptions extends SyncOptions = SyncOptions> {
  get(id: number, options?: GetOptions): Promise<ShopifyObjectType | null>;
}