import { IShopifyConnect } from '../auth/interfaces/connect';
import { Express } from 'express';

export interface Session extends Express.Session {
  // see get-user.middleware.ts
  user?: IShopifyConnect;
  // see get-shopify-connect.middleware.ts
  shopifyConnect?: IShopifyConnect;
  // see get-request-type.middleware.ts
  isAppBackendRequest?: boolean;
  isThemeClientRequest?: boolean;
  isUnknownClientRequest?: boolean;
  isLoggedInToAppBackend?: boolean;
  /** @deprecated */
  shop?: string;
  lastShop?: string;
  // See auth.controller.ts
  nonce?: string;
  // passport
  passport: {
    user: number;
  };
}