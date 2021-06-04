import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

import { IUserRequest, IShopifyConnect } from '../interfaces/user-request';
import { TRoles } from '../auth/interfaces/role';
import { DebugService } from '../debug.service';
import { ShopifyAuthService } from '../auth/auth.service';
import { SessionSocket } from '../interfaces/session-socket';

/**
 * Guard to check the backend user roles
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
    // this.logger.debug('context', context);
    const roles = this.reflector.get<TRoles>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest() as IUserRequest;
    // this.logger.debug('request', request);

    // Check if request is really a http request
    if (request.app) {
      return this.validateRequest(request, roles);
    }

    const client = context.switchToWs().getClient();
    // this.logger.debug('client', client);

    // Check if client is really a socket client
    if (client.handshake) {
      return this.validateClient(client, roles);
    }
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

  validateRequest(req: IUserRequest, roles?: TRoles) {
    // if no roles are passtthis route do not need any role so activate this with true
    if (!roles || roles.length === 0) {
      return true;
    }

    // Only logged in users can have any role
    if (!req.session.isLoggedInToAppBackend) {
      return false;
    }

    // DO NOT USE req.session[`shopify-connect-${req.shop}`] because this can always be set on theme-client requests
    if (!this.hasRole(req.session[`user-${req.shop}`], roles)) {
      return false;
    }
    return true;
  }

  validateClient(client: SessionSocket, roles?: TRoles) {
    // if no roles are passt this route do not need any role so activate this with true
    if (!roles || roles.length === 0) {
      return true;
    }

    // Only logged in users can have any role
    if (!client.handshake.session.isLoggedInToAppBackend) {
      return false;
    }

    // DO NOT USE request.session.user because this can always be set on theme requests
    if (
      !this.hasRole(
        client.handshake.session[
          `user-${client.handshake.session.currentShop}`
        ],
        roles,
      )
    ) {
      return false;
    }

    return true;
  }
}
