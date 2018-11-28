import { Request } from '@nestjs/common';
import { IShopifyConnect } from 'shopify/auth/interfaces/connect';

// TODO move ti interfaces
interface IUserRequest extends Request {
  user: IShopifyConnect;
}

export { IShopifyConnect, IUserRequest }