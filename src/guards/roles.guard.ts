import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

import { IUserRequest, IShopifyConnect } from '../interfaces/user-request';
import { TRoles } from '../auth/interfaces/role';
import { DebugService } from '../debug.service';
import { ShopifyAuthService } from '../auth/auth.service'

/**
 *
 */
@Injectable()
export class RolesGuard implements CanActivate {

  protected logger = new DebugService('shopify:RolesGuard');

  constructor(
    private readonly reflector: Reflector,
    private readonly shopifyAuthService: ShopifyAuthService,
    ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const roles = this.reflector.get<string[]>('roles', context.getHandler()) as TRoles;
    return this.validateRequest(request, roles);
  }

  hasRole(user: IShopifyConnect, roles: TRoles) {
    // this.logger.debug('hasRole', roles, user.roles);
    const hasRoule = user.roles.some((role) => {
      // this.logger.debug('hasRole role', role);
      return roles.includes(role);
    });
    this.logger.debug('hasRole result', hasRoule);
    return hasRoule;
  }

  validateRequest(request: IUserRequest, roles?: TRoles) {

    // if no roles are passt using @Roles('admin') this route do not need any role so activate this with true
    if (!roles || roles.length === 0) {
      return true;
    }

    // Only logged in users can have any role
    if (!this.shopifyAuthService.isLoggedIn(request)) {
      return false;
    }

    if (!this.hasRole(request.user, roles)) {
      return false;
    }

    return true;
  }
}
