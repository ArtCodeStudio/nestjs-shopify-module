import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';

import { IUserRequest } from '../interfaces/user-request';
import { ShopifyConnectService } from '../auth/connect.service';
import { ShopifyAuthService } from '../auth/auth.service';
import { SessionSocket } from '../interfaces/session-socket';

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
    // this.logger.debug('context', context);
    const request = context.switchToHttp().getRequest() as IUserRequest;
    // this.logger.debug('request', request);
    // Check if request is really a http request
    if (request.app) {
      return this.validateRequest(request);
    }

    const client = context.switchToWs().getClient();
    // this.logger.debug('client', client);
    // Check if client is really a socket client
    if (client.handshake) {
      return this.validateClient(client);
    }
  }

  /**
   * @param request Validate http request
   */
  validateRequest(request: IUserRequest) {
    // See get-shopify-connect.middleware.ts
    if (request.shopifyConnect) {
      return true;
    }
    return false;
  }

  /**
   *
   * @param client Validate websocket request
   */
  validateClient(client: SessionSocket) {
    /**
     * Use https://github.com/oskosk/express-socket.io-session to get the session from handshake
     */
    if (client.handshake && client.handshake.session && client.handshake.session.shopifyConnect) {
      return true;
    }
    return false;
  }

}

export { ShopifyApiGuard };