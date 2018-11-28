import { use, serializeUser, deserializeUser } from 'passport';
import {  } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-shopify'; // https://github.com/danteata/passport-shopify
import { ShopifyConnectService } from './connect.service';
import { DebugService } from '../../debug.service';
import { ShopifyAuthController } from './auth.controller';
import { IShopifyAuthProfile } from './interfaces/profile';
import { ConfigService } from '../../config.service';
import { IShopifyConnect } from '../interfaces/user-request';

export class ShopifyAuthStrategy extends PassportStrategy(Strategy, 'shopify') {

  protected logger = new DebugService('shopify:ShopifyAuthStrategy');

  protected authController: ShopifyAuthController;

  constructor( shop: string, private shopifyConnectService: ShopifyConnectService ) {
    super (
      {
        clientID: ConfigService.shopify.clientID,
        clientSecret: ConfigService.shopify.clientSecret,
        callbackURL: ConfigService.shopify.callbackURL,
        shop,
      },
      /* this.validate, */
    );

    serializeUser(this.serializeUser.bind(this));

    deserializeUser(this.deserializeUser.bind(this));
  }

  /**
   * Verify callback method, called insite of the InstagramAuthStrategy
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

    return this.shopifyConnectService.connectOrUpdate(profile, accessToken)
    .then((user) => {
      return done(null, user); // see AuthStrategy -> serializeUser
    })
    .catch((err) => {
      this.logger.error(err);
      return done(err);
    });
  }

  serializeUser(user: IShopifyConnect, done) {
    this.logger.debug(`serializeUser user id`, user.shopifyID);
    return done(null, user.shopifyID);
  }

  deserializeUser(id: number, done) {
    this.logger.debug(`deserializeUser`, id);
    return this.shopifyConnectService.findByShopifyId(id)
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
