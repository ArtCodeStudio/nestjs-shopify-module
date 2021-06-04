import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

import { IUserRequest } from '../interfaces/user-request';
import { Session } from '../interfaces/session';
import { TRequestTypes } from '../auth/interfaces/request-type';
import { DebugService } from '../debug.service';
import { ShopifyAuthService } from '../auth/auth.service';
import { SessionSocket } from '../interfaces/session-socket';

/**
 * Guard to check where the request comes from (an registed shopify theme or the app backend)
 */
@Injectable()
export class RequestGuard implements CanActivate {
  protected logger = new DebugService('shopify:RequestGuard');

  constructor(
    private readonly reflector: Reflector,
    private readonly shopifyAuthService: ShopifyAuthService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // this.logger.debug('context', context);
    // TODO NEST7 CHECKME
    const types = this.reflector.get<TRequestTypes>(
      'request',
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest() as IUserRequest;
    // this.logger.debug('request', request);

    // Check if request is really a http request
    if (request.app) {
      return this.validateRequest(request, types);
    }

    const client = context.switchToWs().getClient();
    // this.logger.debug('client', client);

    // Check if client is really a socket client
    if (client.handshake) {
      return this.validateClient(client, types);
    }
  }

  hasType(session: Session, types: TRequestTypes) {
    let hasType = false;
    types.forEach((type) => {
      if (type === 'app-backend' && session.isAppBackendRequest) {
        hasType = true;
      }
      if (type === 'theme-client' && session.isThemeClientRequest) {
        hasType = true;
      }
    });
    return hasType;
  }

  validateRequest(request: IUserRequest, types?: TRequestTypes) {
    // if no type are passt using @Request('app-backend') this route do not need any role so activate this with true
    if (!types || types.length === 0) {
      return true;
    }

    return this.hasType(request.session, types);
  }

  validateClient(client: SessionSocket, types?: TRequestTypes) {
    // if no types are passt using @Request('app-backend') this route do not need any role so activate this with true
    if (!types || types.length === 0) {
      return true;
    }

    return this.hasType(client.handshake.session, types);
  }
}
