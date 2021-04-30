export interface RootGet<ShopifyObjectType, GetOptions> {
  get(
    id: number,
    options?: GetOptions
  ): Promise<Partial<ShopifyObjectType> | null>;
}
