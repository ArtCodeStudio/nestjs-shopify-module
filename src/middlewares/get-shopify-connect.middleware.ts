import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { DebugService } from '../debug.service';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { IUserRequest } from '../interfaces/user-request';

@Injectable()
export class GetShopifyConnectMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    private readonly shopifyAuthService: ShopifyAuthService,
  ) {

  }
  async resolve(...args: any[]): Promise<MiddlewareFunction> {
    return async (req: IUserRequest, res, next) => {
      if (req.session && req.session.user) {
        req.user = req.session.user;
      }
      this.shopifyAuthService.getShopifyConnectByRequestSecureForThemeClients(req)
      .then((shopifyConnect: IShopifyConnect | null) => {
        this.logger.debug('shopifyConnect', shopifyConnect);
        if (!shopifyConnect) {
          return next();
        }
        // set to session
        req.session.shopifyConnect = shopifyConnect;

        // set to request
        req.shopifyConnect = req.session.shopifyConnect;
        return next();
      });
    };
  }
}