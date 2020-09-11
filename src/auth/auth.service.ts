import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';

import { IUserRequest } from '../interfaces/user-request';
import { IShopifyConnect } from './interfaces/connect';
import { DebugService } from '../debug.service';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { IShopifyAuthProfile } from './interfaces/profile';
import { SHOPIFY_MODULE_OPTIONS } from '../shopify.constants';
import { ShopifyConnectService } from './connect.service';
import * as ShopifyToken from 'shopify-token'; // https://github.com/lpinca/shopify-token
import { Shops, Options } from 'shopify-admin-api';
import { Session } from '../interfaces/session';

@Injectable()
export class ShopifyAuthService {
  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions,
    private readonly shopifyConnectService: ShopifyConnectService,
  ){}
  protected logger = new DebugService('shopify:AuthService');

  /**
   * Alternative for AuthStrategy.oAuthConnect.
   * Used for auth with a clientsite redirect (needed in the shopify iframe).
   * @param request Express request object
   * @param myshopify_domain shop origin, e.g. myshop.myshopify.com
   * @param redirectUri whitelisted redirect URI from Shopify Partner Dashboard
   *
   * @see https://help.shopify.com/en/api/embedded-apps/embedded-app-sdk/oauth
   */
  oAuthConnect(request: IUserRequest, myshopify_domain?: string) {

    if (!myshopify_domain) {
      myshopify_domain = this.getShopSecureForThemeClients(request);
    }

    if (!myshopify_domain) {
      throw new Error('myshopify_domain is required');
    }

    const shopifyToken = new ShopifyToken({
      sharedSecret: this.shopifyModuleOptions.shopify.clientSecret,
      apiKey: this.shopifyModuleOptions.shopify.clientID,
      scopes: this.shopifyModuleOptions.shopify.scope,
      redirectUri: this.shopifyModuleOptions.shopify.iframeCallbackURL,
    });

    const nonce = shopifyToken.generateNonce();
    const authUrl = shopifyToken.generateAuthUrl(myshopify_domain);
    return {
      nonce,
      authUrl,
    };
  }

  /**
   * Alternative for AuthStrategy.validate.
   * Used for auth with a clientsite redirect (needed in the shopify iframe).
   * @param hmac
   * @param signature
   * @param state
   * @param code
   * @param shop
   * @param timestamp
   * @param session
   */
  async oAuthCallback(hmac: string, signature: string, state: string, code: string, shop: string, timestamp: string, session) {
    const shopifyToken = new ShopifyToken({
      sharedSecret: this.shopifyModuleOptions.shopify.clientSecret,
      apiKey: this.shopifyModuleOptions.shopify.clientID,
      scopes: this.shopifyModuleOptions.shopify.scope,
      redirectUri: this.shopifyModuleOptions.shopify.iframeCallbackURL,
    });
    const ok = shopifyToken.verifyHmac({
      hmac,
      signature,
      state,
      code,
      shop,
      timestamp,
    });

    if (!ok) {
      throw new Error('unauthorized');
    }

    // TODO Fix type on https://github.com/lpinca/shopify-token see https://shopify.dev/tutorials/authenticate-with-oauth
    return (shopifyToken.getAccessToken(shop, code) as Promise<{ access_token: string; scope: string }>)
    .then(async (responise) => {
      this.logger.debug('[getAccessToken] responise', responise);
      const shops = new Shops(shop, responise.access_token); // // TODO NEST7 CHECKME also store returned scope?
      return shops.get()
      .then(async (shopObject) => {
        const profile: IShopifyAuthProfile = {
          provider: 'shopify',
          _json: {
            shop: shopObject,
          },
          displayName: shopObject.name,
          username: shopObject.name,
          id: shopObject.id.toString(),
          _raw: '',
        };
        this.logger.debug(`profile:`, profile);
        return this.shopifyConnectService.connectOrUpdate(profile, responise.access_token)
        .then((user) => {
          if (!user) {
            throw new Error('Error on connect or update user');
          }
          this.logger.debug(`validate user, user.myshopify_domain: `, user.myshopify_domain);
          // Passport stores the user in req.user
          session[`user-${user.myshopify_domain}`] = user;
          // For fallback if no shop is set in request.headers
          session.shop = user.myshopify_domain;
          return user;
        })
        .catch((err) => {
          this.logger.debug('Error on oAuthCallback', err);
          this.logger.error(err);
          throw err;
        });
      });
    });
  }

  /**
   * Check if the request comes from app backend or shopify theme client and get the myshopify domain
   * @param request Express request object
   */
  async getRequestType(request: IUserRequest) {
    const result = {
      isAppBackendRequest: false,
      isThemeClientRequest: false,
      isUnknownClientRequest: false,
      myshopifyDomain: null as string | null,
    };
    const host = this.getClientHost(request);
    this.logger.debug('host', host, 'app.host', this.shopifyModuleOptions.app.host);
    if (host === this.shopifyModuleOptions.app.host) {
      result.isAppBackendRequest = true;
      return this.getMyShopifyDomainUnsecure(request)
      .then((myshopifyDomain) => {
        if (myshopifyDomain) {
          result.myshopifyDomain = myshopifyDomain;
        }
        return result;
      });
    } else {
      return this.getMyShopifyDomainSecureForThemeClients(request)
      .then((myshopifyDomain) => {
        if (myshopifyDomain && myshopifyDomain.endsWith('.myshopify.com')) {
          result.isThemeClientRequest = true;
          result.myshopifyDomain = myshopifyDomain;
        } else {
          result.isUnknownClientRequest = true;
        }
        return result;
      });
    }
  }

  /**
   * Like SecureForThemeClients but always returns the myshopify_domain if found
   *
   * @param request
   */
  async getMyShopifyDomainSecureForThemeClients(request: IUserRequest) {
    const anyDomain = this.getShopSecureForThemeClients(request);
    if (!anyDomain) {
      throw new Error('Shop not found! ' + anyDomain);
    }
    if (anyDomain.endsWith('.myshopify.com')) {
      return anyDomain;
    }
    return this.shopifyConnectService.findByDomain(anyDomain)
    .then((shopifyConnect) => {
      this.logger.debug('getMyShopifyDomain', shopifyConnect.myshopify_domain);
      return shopifyConnect.myshopify_domain;
    });
  }

  /**
   * Check if user is logged in on request
   * @param request
   */
  protected isLoggedIn(session: Session) {
    this.logger.debug('isLoggedIn');
    if (session.user !== null && typeof session.user === 'object') {
      return true;
    }
    return false;
  }

  /**
   * Get the client host on request
   * @param request
   */
  protected getClientHost(request: IUserRequest) {
    let host: string;
    if (request.headers.origin) {
      // request comes from shopify theme
      host = (request.headers.origin as string).split('://')[1];
    } else {
      // request from app backend
      host = request.headers.host;
    }
    return host;
  }

  /**
   * Get the shop the request comes from.
   * If a shop string is returned, the request is either from a shop theme or the backend app with logged in user,
   * otherwise null is returend
   *
   * This is method can be used to get the shopifyConnect object because this method only returns the shop on allowed hosts.
   *
   * @param request
   */
  protected getShopSecureForThemeClients(request: IUserRequest): string | null {
    let shop = null;
    const host = this.getClientHost(request);

    this.logger.debug('getShopSecureForThemeClients', host);

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
    if (host === this.shopifyModuleOptions.app.host) {
      if (!this.isLoggedIn(request.session)) {
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

  /**
   * Unsecure version of getMyShopifyDomainSecureForThemeClients.
   *
   * This also returns the shopify domain if just the shop is set has query param or header param.
   *
   * Do not use this on dangerous authentications like get the shopifyConnect object
   * only if you know what you are doing.
   *
   * @param request
   */
  protected async getMyShopifyDomainUnsecure(request: IUserRequest) {
    let shop: string;

    // Get shop from header
    if (request.headers) {
      if (request.headers.shop || request.headers['x-shopify-shop-domain']) {
        /**
         * Note: You Can set the shop header in the client for each jquery request by:
         *
         * ```
         *  JQuery.ajaxSetup({
         *    beforeSend: (xhr: JQueryXHR) => {
         *      xhr.setRequestHeader('shop', shop);
         *    },
         *  });
         * ```
         *
         * Or on riba with:
         *
         * ```
         *   Utils.setRequestHeaderEachRequest('shop', shop);
         * ```
         */
        shop = (request.headers.shop as string) || (request.headers['x-shopify-shop-domain'] as string);
        if (shop.endsWith('.myshopify.com')) {
          return shop;
        }
      }
      // From shopify theme
      if (request.headers.origin) {
        shop = (request.headers as any).origin.split('://')[1];
        if (shop.endsWith('.myshopify.com')) {
          return shop;
        }
      }
    }

    // Get shop from query param
    if (typeof request.query.shop === 'string') {
      shop = request.query.shop;
      if (shop.endsWith('.myshopify.com')) {
        return shop;
      }
    }

    // Fallback
    if (request.session.shop) {
      shop = request.session.shop;
      if (shop.endsWith('.myshopify.com')) {
        return shop;
      }
    }

    if (!shop) {
      throw new Error('Shop not found! ' + shop);
    }

    return this.shopifyConnectService.findByDomain(shop)
    .then((shopifyConnect) => {
      this.logger.debug('getMyShopifyDomain', shopifyConnect.myshopify_domain);
      return shopifyConnect.myshopify_domain;
    });
  }
}
