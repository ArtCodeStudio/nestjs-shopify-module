import { Injectable, NestMiddleware } from '@nestjs/common';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';
import { IUserRequest } from '../interfaces/user-request';
import { Response, NextFunction } from 'express';

@Injectable()
export class GetShopifyConnectMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    private readonly shopifyConnectService: ShopifyConnectService,
  ) {

  }
  async use(req: IUserRequest, res: Response, next: NextFunction) {
    return this.shopifyConnectService.findByDomain(req.session.shop)
    .then((shopifyConnect) => {
      // this.logger.debug('shopifyConnect', shopifyConnect);
      if (!shopifyConnect) {
        return next();
      }
      // set to session
      req.session.shopifyConnect = shopifyConnect;

      // set to request
      req.shopifyConnect = req.session.shopifyConnect;
      return next();
    });
  }
}