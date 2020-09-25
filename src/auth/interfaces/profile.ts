import { Interfaces as ShopifyInterfaces} from 'shopify-admin-api'; // https://github.com/ArtCodeStudio/shopify-admin-api
import { Profile } from 'passport'

/**
 * @see http://www.passportjs.org/docs/profile/
 */
export interface IShopifyAuthProfile extends Profile {
  provider: 'shopify';
  _raw: string;
  _json: {
    shop: ShopifyInterfaces.Shop
  }
}