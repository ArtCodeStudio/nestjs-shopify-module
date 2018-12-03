import { IShopifyConnect } from '../auth/interfaces/connect';
interface IUserRequest extends Request {
    user: IShopifyConnect;
}
export { IShopifyConnect, IUserRequest };
