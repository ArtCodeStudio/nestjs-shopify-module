import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';

import { IUserRequest } from 'shopify/interfaces/user-request';
import { ShopifyConnectService } from 'shopify/auth/connect.service';
import { ShopifyAuthService } from 'shopify/auth/auth.service';

import { DebugService } from 'debug.service';
import { ConfigService } from 'config.service';

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

    // The client host or the users logged in shop domain must be saved in the database
    // TODO move to middleware?
    return this.shopifyConnectService.findByDomain(shop)
    .then((shopifyConnect) => {
      this.logger.debug(`shopifyConnectService.findByDomain result`, shopifyConnect);
      if (shopifyConnect && shopifyConnect.shop) {
        if (shop === shopifyConnect.shop.domain || shop === shopifyConnect.shop.myshopify_domain) {
          return true;
        }
      }
      return false;
    })
    .catch((error) => {
      this.logger.error(error);
      return false;
    });
  }

}

export { ShopifyApiGuard };