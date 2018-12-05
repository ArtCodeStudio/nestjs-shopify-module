import { Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-shopify'; // https://github.com/danteata/passport-shopify
import { ShopifyConnectService } from './connect.service';
import { DebugService } from '../debug.service';
import { ShopifyAuthController } from './auth.controller';
import { IShopifyAuthProfile } from './interfaces/profile';
import { IShopifyConnect } from '../interfaces/user-request';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { PassportStatic } from 'passport';

export class ShopifyAuthStrategy extends PassportStrategy(Strategy, 'shopify') {

  protected logger = new DebugService('shopify:ShopifyAuthStrategy');

  protected authController: ShopifyAuthController;

  constructor(
    shop: string,
    private shopifyConnectService: ShopifyConnectService,
    private readonly shopifyModuleOptions: ShopifyModuleOptions,
    private readonly passport: PassportStatic,
  ) {
    super (
      {
        clientID: shopifyModuleOptions.clientID,
        clientSecret: shopifyModuleOptions.clientSecret,
        callbackURL: shopifyModuleOptions.callbackURL,
        shop,
      },
    );

    this.passport.serializeUser((user: IShopifyConnect, done) => {
      console.error('serializeUser');
      return this.serializeUser(user, done);
    });
    this.passport.deserializeUser((id: number, done) => {
      console.error('deserializeUser');
      return this.deserializeUser(id, done);
    });
  }

  /**
   * Verify callback method, called insite of the ShopifyAuthStrategy
   * @param shop
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @param verifiedDone
   */
  async validate(accessToken, refreshToken, profile: IShopifyAuthProfile, done) {
    this.logger.debug(`accessToken`, accessToken);
    this.logger.debug(`refreshToken`, refreshToken);
    this.logger.debug(`profile.displayName`, profile.displayName);

    return this.shopifyConnectService.connectOrUpdate(profile, accessToken)
    .then((user) => {
      if (!user) {
        throw new Error('Error on connect or update user');
      }
      this.logger.debug(`validate user, user.myshopify_domain: `, user.myshopify_domain);
      return done(null, user); // see AuthStrategy -> serializeUser
    })
    .catch((err) => {
      this.logger.debug('Error on ShopifyAuthStrategy', err);
      this.logger.error(err);
      done(err);
      return err;
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
      done(error);
    });
  }

  public authenticate(req, options) {
    return super.authenticate(req, options);
  }

}
