import { Request } from 'express';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { Session } from './session';

interface IUserRequest extends Request {
  /** Logged in user, setted by passport. This is used to check if the user is logged in */
  user?: IShopifyConnect;
  shop?: string;
  /** @deprecated use req.session.shops instead */
  shops?: string[];
  /** @deprecated Use req.session[`shopify-connect-${shop}`] instead */
  shopifyConnect?: IShopifyConnect;
  session: Session;
}

export { IShopifyConnect, IUserRequest };