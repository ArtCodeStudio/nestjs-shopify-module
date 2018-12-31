import { IShopifyConnect } from '../auth/interfaces/connect';

export interface Session {
  shop?: string;
  user?: IShopifyConnect;
  shopifyConnect?: IShopifyConnect;
}