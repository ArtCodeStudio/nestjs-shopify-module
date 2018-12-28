import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { DebugService } from '../debug.service';

@Injectable()
export class GetUserMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    private readonly shopifyAuthService: ShopifyAuthService,
  ) {

  }
  async resolve(...args: any[]): Promise<MiddlewareFunction> {
    return async (req, res, next) => {
      let shop = await this.shopifyAuthService.getMyShopifyDomainUnsecure(req)
      .catch((error) => {
        // DO nothing
        // this.logger.debug(error);
      });
      if (!shop && req.session.shop) {
        shop = req.session.shop;
      }
      if (!shop) {
        this.logger.debug('WARNING shop not found, use the first user, please fix me');
        return next();
      }
      req.session.shop = shop;
      // WORAROUND for AuthService.oAuthConnect wich stores the user in the session
      if (req.session) {
        if(req.session[`user-${shop}`]) {
          req.user = req.session[`user-${shop}`];
          return next();
        }
      }

      if(req[`user-${shop}`]) {
        req.user = req[`user-${shop}`];
        return next();
      }

      return next();
    };
  }
}