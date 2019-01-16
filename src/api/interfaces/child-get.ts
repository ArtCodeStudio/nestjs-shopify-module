import { SyncOptions } from './options';
export interface ChildGet<ShopifyObjectType, GetOptions extends SyncOptions = SyncOptions> {
  get(parentId: number, id: number, options?: GetOptions): Promise<ShopifyObjectType | null>;
}