import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { DebugService } from '../debug.service';
import { IUserRequest } from '../interfaces/user-request';

@Injectable()
export class GetRequestTypeMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    private readonly shopifyAuthService: ShopifyAuthService,
  ) {

  }
  async resolve(...args: any[]): Promise<MiddlewareFunction> {
    return async (req: IUserRequest, res, next) => {
      let type = await this.shopifyAuthService.getRequestType(req)
      .catch((error) => {
        // DO nothing
        this.logger.error(error);
      });

      if (type) {
        req.session.isAppBackendRequest = type.isAppBackendRequest;
        req.session.isThemeClientRequest = type.isThemeClientRequest;
        req.session.isUnknownClientRequest = type.isUnknownClientRequest;
        req.session.isLoggedInToAppBackend = type.isLoggedInToAppBackend;
        req.session.shop = type.myshopifyDomain;
      }

      return next();
    };
  }
}