import { Options } from "shopify-admin-api";
export interface RootList<
  ShopifyObjectType,
  ListOptions extends Options.BasicListOptions = Options.BasicListOptions
> {
  list(options: ListOptions): Promise<Partial<ShopifyObjectType>[]>;
}
