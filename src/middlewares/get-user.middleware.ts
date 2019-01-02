import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { DebugService } from '../debug.service';
import { IUserRequest } from '../interfaces/user-request';

@Injectable()
export class GetUserMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    private readonly shopifyAuthService: ShopifyAuthService,
  ) {

  }
  async resolve(...args: any[]): Promise<MiddlewareFunction> {
    return async (req: IUserRequest, res, next) => {
      let shop = await this.shopifyAuthService.getMyShopifyDomainUnsecure(req)
      .catch((error) => {
        // DO nothing
        // this.logger.debug(error);
      });

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
      if (!shop && req.session.shop) {
        // Fallback, Shopify App clientsite code does not seem to support multiple logged in apps users
        shop = req.session.shop;
      }
      if (!shop) {
        this.logger.warn('Shop not found');
        return next();
      }
      req.session.shop = shop;
      // WORAROUND for AuthService.oAuthConnect wich stores the user in the session
      if (req.session) {
        if(req.session[`user-${shop}`]) {
          // set to session (for websockets)
          req.session.user = req.session[`user-${shop}`];
          // set to request (for passport and co)
          req.user = req.session.user;
          return next();
        }
      }

      if(req[`user-${shop}`]) {
        // set to request (for passport and co)
        req.user = req[`user-${shop}`];
        // set to session (for websockets)
        req.session.user = req.user;
        
        return next();
      }

      return next();
    };
  }
}