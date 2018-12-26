import { Request } from '@nestjs/common';
import { IShopifyConnect } from '../auth/interfaces/connect';

interface IUserRequest extends Request {
  user?: IShopifyConnect;
  shopifyConnect?: IShopifyConnect;
}

export { IShopifyConnect, IUserRequest }