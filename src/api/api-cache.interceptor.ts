import { Injectable, CacheInterceptor, ExecutionContext } from '@nestjs/common';
import { DebugService } from 'debug.service';
import { ConfigService } from 'config.service';

@Injectable()
export class ApiCacheInterceptor extends CacheInterceptor {

  logger = new DebugService(`shopify:ApiCacheInterceptor`);

  // TODO move to utils
  getClientHost(request) {
    let host;
    if ((request.headers as any).origin) {
      // request from shopify theme
      host = (request.headers as any).origin.split('://')[1];
    } else {
      // request from app backend
      host = (request.headers as any).host;
    }
    return host;
  }

  // TODO move to utils
  isLoggedIn(request) {
    this.logger.debug('isLoggedIn', request.user);
    if (request.user !== null && typeof request.user === 'object') {
      return true;
    }
    return false;
  }

  /**
   * Cache by url and host
   * @param context
   */
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.getArgByIndex(0);
    let key = super.trackBy(context);
    this.logger.debug(`trackBy check key ${key}`);
    if (!key) {
      return undefined;
    }
    let host = this.getClientHost(request);
    if (host === ConfigService.app.host) {
      // this.logger.debug(`request from backend`, request.user);

      // Do not cache if no user is logged in
      if (!this.isLoggedIn(request)) {
        return undefined;
      }

      host = request.user.shop.domain;
    }
    key = `${host}:${key}`;
    this.logger.debug(`trackBy cache by ${key}`);
    return key;
  }
}