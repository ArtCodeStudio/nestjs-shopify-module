import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';
import { IUserRequest } from '../interfaces/user-request';
import { Response, NextFunction } from 'express';

@Injectable()
export class GetUserMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    private readonly shopifyAuthService: ShopifyAuthService,
    private readonly shopifyConnectService: ShopifyConnectService,
  ) {

  }
  async resolve(...args: any[]): Promise<MiddlewareFunction> {
    return async (req: IUserRequest, res: Response, next: NextFunction) => {

      let requestType = await this.shopifyAuthService.getRequestType(req)
      .catch((error) => {
        // DO nothing
        this.logger.error('error', error);
      });

      req.session.isLoggedInToAppBackend = false;

      if (requestType) {
        req.session.isAppBackendRequest = requestType.isAppBackendRequest;
        req.session.isThemeClientRequest = requestType.isThemeClientRequest;
        req.session.isUnknownClientRequest = requestType.isUnknownClientRequest;
        req.session.shop = requestType.myshopifyDomain;
        // this.logger.debug('requestType', requestType);
      }

      // this.logger.debug('req.session', req.session);

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
      if (!req.session.shop) {
        this.logger.warn('Shop not found)');
        return next();
      }

      // get user from session
      if (req.session) {
        if(req.session[`user-${req.session.shop}`]) {
          // set to session (for websockets)
          req.session.user = req.session[`user-${req.session.shop}`];
          // set to request (for passport and co)
          req.user = req.session.user;

          req.session.isLoggedInToAppBackend = true;
          return next();
        }
      }

      // Get user from req
      if (req[`user-${req.session.shop}`]) {
        // set to request (for passport and co)
        req.user = req[`user-${req.session.shop}`];
        // set to session (for websockets)
        req.session.user = req.user;

        req.session.isLoggedInToAppBackend = true;
        
        return next();
      }

      // Get user from passport session
      if (req.session.passport && req.session.passport.user) {
        return this.shopifyConnectService.findByShopifyId(req.session.passport.user)
        .then((user) => {
          if (user) {
            // set to request (for passport and co)
            req.user = user;
            // set to session (for websockets)
            req.session.user = req.user;

            req.session.isLoggedInToAppBackend = true;

            return next();
          }
        })
        .catch((error) => {
          this.logger.error(error);
        })
      }

      return next();
    };
  }
}