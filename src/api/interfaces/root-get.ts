import { ISyncOptions } from "./options";
export interface RootGet<
  ShopifyObjectType,
  GetOptions extends ISyncOptions = ISyncOptions
> {
  get(
    id: number,
    options?: GetOptions
  ): Promise<Partial<ShopifyObjectType> | null>;
}
