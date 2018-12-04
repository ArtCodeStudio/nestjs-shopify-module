import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-shopify'; // https://github.com/danteata/passport-shopify
import { ShopifyConnectService } from './connect.service';
import { DebugService } from '../debug.service';
import { ShopifyAuthController } from './auth.controller';
import { IShopifyAuthProfile } from './interfaces/profile';
import { IShopifyConnect } from '../interfaces/user-request';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';

export class ShopifyAuthStrategy extends PassportStrategy(Strategy, 'shopify') {

  protected logger = new DebugService('shopify:ShopifyAuthStrategy');

  protected authController: ShopifyAuthController;

  constructor(
    shop: string,
    private shopifyConnectService: ShopifyConnectService,
    private readonly shopifyModuleOptions: ShopifyModuleOptions
  ) {
    super (
      {
        clientID: shopifyModuleOptions.clientID,
        clientSecret: shopifyModuleOptions.clientSecret,
        callbackURL: shopifyModuleOptions.callbackURL,
        shop,
      },
      /* this.validate, */
    );

    // serializeUser(this.serializeUser.bind(this));
    // deserializeUser(this.deserializeUser.bind(this));
  }

  /**
   * Verify callback method, called insite of the ShopifyAuthStrategy
   * @param shop
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @param verifiedDone
   */
  validate(accessToken, refreshToken, profile: IShopifyAuthProfile, done) {
    this.logger.debug(`accessToken`, accessToken);
    this.logger.debug(`refreshToken`, refreshToken);
    this.logger.debug(`profile`, profile);

    this.shopifyConnectService.connectOrUpdate(profile, accessToken)
    .then((user) => {
      if (!user) {
        throw new Error('Error on connect or update user');
      }
      this.logger.debug(`validate user`, user);
      return done(null, user); // see AuthStrategy -> serializeUser
    })
    .catch((err) => {
      this.logger.error('Error on ShopifyAuthStrategy.validate');
      this.logger.error(err);
      return done(err);
    });
  }

  public serializeUser(user: IShopifyConnect, done) {
    this.logger.debug(`serializeUser user id`, user.shopifyID);
    return done(null, user.shopifyID);
  }

  public deserializeUser(id: number, done) {
    this.logger.debug(`deserializeUser`, id);
    this.shopifyConnectService.findByShopifyId(id)
    .then((user) => {
      return done(null, user);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return done(error);
    });
  }

  public authenticate(req, options) {
    return super.authenticate(req, options);
  }

}
