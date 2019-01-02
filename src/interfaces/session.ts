import { IShopifyConnect } from '../auth/interfaces/connect';

export interface Session {
  // see get-user.middleware.ts
  user?: IShopifyConnect;
  // see get-shopify-connect.middleware.ts
  shopifyConnect?: IShopifyConnect;
  // see get-request-type.middleware.ts
  isAppBackendRequest?: boolean;
  isThemeClientRequest?: boolean;
  isUnknownClientRequest?: boolean;
  isLoggedInToAppBackend?: boolean;
  shop?: string;
  // See auth.controller.ts
  nonce?: string;
  // passport
  passport: {
    user: number;
  }
}