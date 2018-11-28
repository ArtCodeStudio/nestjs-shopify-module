import { Inject, Injectable } from '@nestjs/common';

import { IUserRequest } from '../interfaces/user-request';
import { DebugService } from '../debug.service';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { SHOPIFY_MODULE_OPTIONS } from '../shopify.constants';

@Injectable()
export class ShopifyAuthService {
  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions
  ){}
  protected logger = new DebugService('shopify:AuthService');

  /**
   * Check if user is logged in on request
   * @param request
   */
  isLoggedIn(request: IUserRequest) {
    this.logger.debug('isLoggedIn');
    if (request.user !== null && typeof request.user === 'object') {
      return true;
    }
    return false;
  }

  /**
   * Get the client host on request
   * @param request
   */
  getClientHost(request) {
    let host;
    if ((request.headers as any).origin) {
      // request comes from shopify theme
      host = (request.headers as any).origin.split('://')[1];
    } else {
      // request from app backend
      host = (request.headers as any).host;
    }
    return host;
  }

  /**
   * Get the shop the request comes from.
   * If a shop string is returned, the request is either from a shop theme or the backend app with logged in user,
   * otherwise null is returend
   * @param request
   */
  getShop(request: IUserRequest) {
    let shop = null;
    const host = this.getClientHost(request);

    this.logger.debug('validateRequest', host);

    if (!host) {
      this.logger.debug(`no host!`);
      return null;
    }

    /**
     * Only get the shop by the shop query param on the .shopifypreview.com domain.
     * For security reasons, we only accept the domains registered for the shop,
     * but at .shopifypreview.com we make an exception
     */
    if (host.endsWith('.shopifypreview.com')) {
      // this.logger.debug('preview url', host, (request as any).query);
      if ((request as any).query && (request as any).query.shop) {
        shop = (request as any).query.shop;
        this.logger.debug('preview shop', shop);
        return shop;
      }
    }

    // if the host is the host of the app backend the user needs to be logged in
    if (host === this.shopifyModuleOptions.appHost) {
      if (!this.isLoggedIn(request)) {
        return null;
      }
      // the shop domain is the shop domain of the logged in user
      shop = request.user.shop.domain;
      return shop;
    } else {
      // the shop domain is the domain where the request comes from
      shop = host;
    }

    return shop;
  }
}
