import { Models as ShopifyModels} from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { Profile } from 'passport'

/**
 * @see http://www.passportjs.org/docs/profile/
 */
export interface IShopifyAuthProfile extends Profile {
  provider: 'shopify';
  _raw: string;
  _json: {
    shop: ShopifyModels.Shop
  }
}