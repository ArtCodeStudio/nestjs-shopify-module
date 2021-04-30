import { Options } from "shopify-admin-api";
export interface ChildList<
  ShopifyObjectType,
  ListOptions extends Options.BasicListOptions = Options.BasicListOptions
> {
  list(parentId: number, options: ListOptions): Promise<ShopifyObjectType[]>;
}
