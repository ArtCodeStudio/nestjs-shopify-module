import { Injectable, Inject } from '@nestjs/common';
import { ShopifyConnectService} from './connect.service';
import { DebugService } from '../debug.service';
import { PassportStatic } from 'passport';
import { IShopifyConnect } from '../interfaces/user-request';

@Injectable()
export class PassportService {

  protected logger = new DebugService('shopify:ShopifyConnectService');

  constructor(
    private readonly shopifyConnectService: ShopifyConnectService,
    @Inject('Passport') private readonly passport: PassportStatic,
  ) {
    this.passport.serializeUser(this.serializeUser.bind(this));
    this.passport.deserializeUser(this.deserializeUser.bind(this));
  }

  public serializeUser(user: IShopifyConnect, done) {
    this.logger.debug(`serializeUser user id`, user.shopifyID);
    return done(null, user.shopifyID);
  }

  public deserializeUser(id: number, done) {
    this.logger.debug(`deserializeUser`, id);
    if (!id) {
      const error = new Error("Id not found!");
      this.logger.error(error);
      return done(error);
    }
    this.shopifyConnectService.findByShopifyId(id)
    .then((user) => {
      this.logger.debug(`deserializeUser`, user);
      if (!user) {
        const error = new Error("User not found!");
        this.logger.error(error);
        return done(error);
      }
      return done(null, user);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      done(error);
    });
  }
}