import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';

import { IUserRequest } from '../interfaces/user-request';
import { ShopifyConnectService } from '../auth/connect.service';
import { ShopifyAuthService } from '../auth/auth.service';

import { DebugService } from '../debug.service';

/**
 *
 */
@Injectable()
class ShopifyApiGuard implements CanActivate {

  protected logger = new DebugService('shopify:ShopifyApiGuard');

  constructor(
    @Inject(ShopifyConnectService) private readonly shopifyConnectService: ShopifyConnectService,
    @Inject(ShopifyAuthService) private readonly shopifyAuthService: ShopifyAuthService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  validateRequest(request: IUserRequest) {
    const shop = this.shopifyAuthService.getShop(request);

    this.logger.debug(`validateRequest shop`, shop);

    if (shop === null) {
      return false;
    }

    // See get-shop.middleware.ts
    if (!request.shopifyConnect) {
      return false;
    }

    if (shop === request.shopifyConnect.shop.domain || shop === request.shopifyConnect.shop.myshopify_domain) {
      return true;
    }
  }

}

export { ShopifyApiGuard };