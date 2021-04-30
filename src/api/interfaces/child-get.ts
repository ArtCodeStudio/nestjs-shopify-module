export interface ChildGet<ShopifyObjectType, GetOptions> {
  get(
    parentId: number,
    id: number,
    options?: GetOptions
  ): Promise<ShopifyObjectType | null>;
}
