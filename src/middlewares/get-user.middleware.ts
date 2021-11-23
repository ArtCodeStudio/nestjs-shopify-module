import { Injectable, NestMiddleware } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';
import { IUserRequest, IShopifyConnect } from '../interfaces/user-request';
import { Response, NextFunction } from 'express';

@Injectable()
export class GetUserMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    private readonly shopifyAuthService: ShopifyAuthService,
    private readonly shopifyConnectService: ShopifyConnectService,
  ) {}

  protected setShop(req: IUserRequest, shop: string) {
    req.session.shops = req.session.shops || [];
    if (!req.session.shops.includes(shop)) {
      req.session.shops.push(shop);
    }
    req.session.currentShop = shop;
    req.shop = shop;
  }

  async use(req: IUserRequest, res: Response, next: NextFunction) {
    let shop: string;

    const requestType = await this.shopifyAuthService
      .getRequestType(req)
      .catch((error: Error) => {
        if (
          error &&
          typeof error.message === 'string' &&
          error.message.toLowerCase().includes('shop not found')
        ) {
          // DO nothing
          this.logger.debug(error.message);
        } else {
          this.logger.error(error);
        }
      });

    req.session.isLoggedInToAppBackend = false;

    if (requestType) {
      shop = requestType.myshopifyDomain;
      req.session.isAppBackendRequest = requestType.isAppBackendRequest;
      req.session.isThemeClientRequest = requestType.isThemeClientRequest;
      req.session.isUnknownClientRequest = requestType.isUnknownClientRequest;
      this.setShop(req, shop);
      // this.logger.debug('requestType', requestType);
    }

    // this.logger.debug('req.session', req.session);

    if (!shop) {
      shop = req.session.currentShop;
      this.setShop(req, shop);
    }

    /**
     * If shop is not set you need to add the shop to your header on your shopify app client code like this:
     *
     * ```
     *  JQuery.ajaxSetup({
     *    beforeSend: (xhr: JQueryXHR) => {
     *      xhr.setRequestHeader('shop', shop);
     *    },
     *  });
     * ```
     *
     * Or on riba with:
     *
     * ```
     *   Utils.setRequestHeaderEachRequest('shop', shop);
     * ```
     */
    if (!shop) {
      this.logger.warn('[GetUserMiddleware] Shop not found!');
      return next();
    }

    // get user from session
    if (req.session) {
      if (req.session[`user-${shop}`]) {
        const user = req.session[`user-${shop}`] as IShopifyConnect;
        // set to request (for passport and co)
        req.user = user;

        req.session.isLoggedInToAppBackend = true;
        return next();
      }
    }

    // Get user from req
    if (req.user) {
      const user = req.user;
      // set to session (for websockets)
      this.logger.debug('\n\nSet user: ', user);
      req.session[`user-${shop}`] = user;
      req.session.isLoggedInToAppBackend = true;
      return next();
    }

    // Get user from passport session
    if (req.session.passport && req.session.passport.user) {
      return this.shopifyConnectService
        .findByShopifyId(req.session.passport.user)
        .then((user) => {
          if (user) {
            // set to request (for passport and co)
            req.user = user;
            // set to session (for websockets)
            this.logger.debug('\n\nSet user: ', user);
            req.session[`user-${shop}`] = user;
            req.session.isLoggedInToAppBackend = true;
            return next();
          }
        })
        .catch((error) => {
          this.logger.error(error);
        });
    }

    return next();
  }
}
