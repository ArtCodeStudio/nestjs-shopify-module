import type { IShopifyConnect } from '../auth/interfaces/connect';
import type { Session as ExpressSession } from 'express-session';

export interface Session extends ExpressSession {
  /**  @deprecated use session[`user-${user.myshopify_domain}`] instead  */
  user?: IShopifyConnect;
  /**
   * This is used to get access to any shopify api, also if the user is not logged in.
   * So DO NOT use this to check if the user is logged in and do not make this public!
   * @see get-shopify-connect.middleware.ts
   * @deprecated Use req.session[`shopify-connect-${shop}`] instead
   **/
  shopifyConnect?: IShopifyConnect;
  // see get-request-type.middleware.ts
  isAppBackendRequest?: boolean;
  isThemeClientRequest?: boolean;
  isUnknownClientRequest?: boolean;
  isLoggedInToAppBackend?: boolean;
  /** @deprecated use req.shop instead */
  shop?: string;
  /** if the user is logged in in multiple shops then all these shops are listed here*/
  shops?: string[];
  /** The latest shop domain, if the user is logged in in multiple shops this is the shop domain with which the last request was made */
  currentShop?: string;
  // See auth.controller.ts
  nonce?: string;
  // passport
  passport: {
    user: number;
  };
}
