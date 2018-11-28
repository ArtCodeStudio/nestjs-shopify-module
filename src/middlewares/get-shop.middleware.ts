import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';

@Injectable()
export class GetShopMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    private readonly shopifyAuthService: ShopifyAuthService,
    private readonly shopifyConnectService: ShopifyConnectService,
  ) {

  }
  async resolve(...args: any[]): Promise<MiddlewareFunction> {
    return async (req, res, next) => {
      const shopDomain = this.shopifyAuthService.getShop(req);
      this.logger.debug('shopDomain', shopDomain);
      return this.shopifyConnectService.findByDomain(shopDomain)
      .then((shopifyConnect) => {
        this.logger.debug('shopifyConnect', shopifyConnect);
        req.shopifyConnect = shopifyConnect;
        return next();
      });
    };
  }
}