import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-shopify'; // https://github.com/danteata/passport-shopify
import { ShopifyConnectService } from './connect.service';
import { DebugService } from '../debug.service';
import { ShopifyAuthController } from './auth.controller';
import { IShopifyAuthProfile } from './interfaces/profile';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { PassportStatic } from 'passport';

export class ShopifyAuthStrategy extends PassportStrategy(Strategy, 'shopify') {

  protected logger = new DebugService('shopify:ShopifyAuthStrategy');

  protected authController: ShopifyAuthController;

  constructor(
    shop: string,
    private shopifyConnectService: ShopifyConnectService,
    private readonly shopifyModuleOptions: ShopifyModuleOptions,
    private readonly passport: PassportStatic
  ) {
    super (
      {
        clientID: shopifyModuleOptions.shopify.clientID,
        clientSecret: shopifyModuleOptions.shopify.clientSecret,
        callbackURL: shopifyModuleOptions.shopify.callbackURL,
        shop,
      },
    );
  }

  /**
   * Verify callback method, called insite of the ShopifyAuthStrategy
   *
   * @note Do not use verifiedDone callback function, this leads to "Cannot set headers after they are sent to the client"
   *
   * @param shop
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @param verifiedDone
   */
  async validate(accessToken: string, refreshToken: string, profile: IShopifyAuthProfile/*, verifiedDone: (error?: Error | null, user?: any) => void*/) {
    this.logger.debug(`accessToken: %s`, accessToken);
    this.logger.debug(`refreshToken: %s`, refreshToken);
    this.logger.debug(`profile.displayName: %s`, profile.displayName);

    return this.shopifyConnectService.connectOrUpdate(profile, accessToken)
    .then((user) => {
      if (!user) {
        throw new Error('Error on connect or update user');
      }
      this.logger.debug(`validate user, user.myshopify_domain: %s`, user.myshopify_domain);
      // return verifiedDone(null, user);
      return user; // see AuthStrategy -> serializeUser
    })
    .catch((err) => {
      this.logger.error(err);
      // return verifiedDone(err)
      throw err;
    });
  }


  public authenticate(req, options) {
    try {
      return super.authenticate(req, options);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
    
  }

}
