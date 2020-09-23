import { Request } from 'express';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { Session } from './session';

interface IUserRequest extends Request {
  user?: IShopifyConnect;
  /** @deprecated */
  shop?: string;
  shops?: string[];
  shopifyConnect?: IShopifyConnect;
  session: Session;
}

export { IShopifyConnect, IUserRequest };