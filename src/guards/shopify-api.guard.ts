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
    // See get-shopify-connect.middleware.ts
    if (request.shopifyConnect) {
      return true;
    }
    return false;
  }

}

export { ShopifyApiGuard };