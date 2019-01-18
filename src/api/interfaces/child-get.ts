import { ISyncOptions } from './options';
export interface ChildGet<ShopifyObjectType, GetOptions extends ISyncOptions = ISyncOptions> {
  get(parentId: number, id: number, options?: GetOptions): Promise<ShopifyObjectType | null>;
}