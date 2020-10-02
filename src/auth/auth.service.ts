import { Inject, Injectable } from '@nestjs/common';

import { IUserRequest } from '../interfaces/user-request';
import { DebugService } from '../debug.service';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { IShopifyAuthProfile } from './interfaces/profile';
import { SHOPIFY_MODULE_OPTIONS } from '../shopify.constants';
import { ShopifyConnectService } from './connect.service';
import * as ShopifyToken from 'shopify-token'; // https://github.com/lpinca/shopify-token
import { Shops } from 'shopify-admin-api';
import { Session } from '../interfaces/session';
import { getSubdomain } from '../helpers';

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
   * @param req Express request object
   * @param myshopify_domain shop origin, e.g. myshop.myshopify.com
   * @param redirectUri whitelisted redirect URI from Shopify Partner Dashboard
   *
   * @see https://help.shopify.com/en/api/embedded-apps/embedded-app-sdk/oauth
   */
  oAuthConnect(req: IUserRequest, myshopify_domain?: string) {

    if (!myshopify_domain) {
      myshopify_domain = this.getShopSecureForThemeClients(req);
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
    const shopName = getSubdomain(myshopify_domain);
    const authUrl = shopifyToken.generateAuthUrl(shopName);
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
  async oAuthCallback(hmac: string, signature: string, state: string, code: string, shop: string, timestamp: string, session: Session) {
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
    .then(async (res) => {
      this.logger.debug('[getAccessToken] res: %O', res);
      const shops = new Shops(shop, res.access_token); // // TODO NEST7 CHECKME also store returned scope?
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
        this.logger.debug(`profile: %O`, profile);
        return this.shopifyConnectService.connectOrUpdate(profile, res.access_token)
        .then((user) => {
          if (!user) {
            throw new Error('Error on connect or update user');
          }
          this.logger.debug(`validate user, user.myshopify_domain: %s`, user.myshopify_domain);
          // Passport stores the user in req.user
          session[`user-${user.myshopify_domain}`] = user;

          session.user = user;

          // For fallback if no shop is set in request.headers
          session.currentShop = user.myshopify_domain;
          
          return user;
        })
        .catch((err) => {
          this.logger.debug('Error on oAuthCallback: %O', err);
          this.logger.error(err);
          throw err;
        });
      });
    });
  }

  /**
   * Check if the request comes from app backend or shopify theme client and get the myshopify domain
   * @param req Express request object
   */
  async getRequestType(req: IUserRequest) {
    const result = {
      isAppBackendRequest: false,
      isThemeClientRequest: false,
      isUnknownClientRequest: false,
      myshopifyDomain: null as string | null,
    };
    const host = this.getClientHost(req);
    this.logger.debug('host: %s app.host: %s', host, this.shopifyModuleOptions.app.host);
    if (host === this.shopifyModuleOptions.app.host) {
      result.isAppBackendRequest = true;
      return this.getMyShopifyDomainUnsecure(req)
      .then((myshopifyDomain) => {
        if (myshopifyDomain) {
          result.myshopifyDomain = myshopifyDomain;
        }
        return result;
      });
    } else {
      return this.getMyShopifyDomainSecureForThemeClients(req)
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
   * @param req
   */
  public async getMyShopifyDomainSecureForThemeClients(req: IUserRequest) {
    const anyDomain = this.getShopSecureForThemeClients(req);
    if (!anyDomain) {
      throw new Error('Shop not found! ' + anyDomain);
    }
    if (anyDomain.endsWith('.myshopify.com')) {
      return anyDomain;
    }
    return this.shopifyConnectService.findByDomain(anyDomain)
    .then((shopifyConnect) => {
      if (!shopifyConnect || !shopifyConnect.myshopify_domain) {
        throw new Error('Shop not found! ' + anyDomain);
      }
      this.logger.debug('getMyShopifyDomain: %s', shopifyConnect.myshopify_domain);
      return shopifyConnect.myshopify_domain;
    });
  }

  /**
   * Check if user is logged in on request
   * @param req
   */
  protected isLoggedIn(req: IUserRequest) {
    const shop = req.session.currentShop || req.shop;
    this.logger.debug('isLoggedIn in ' + shop);
    if (req.session[`user-${shop}`] !== null && typeof req.session[`user-${shop}`] === 'object') {
      return true;
    }
    return false;
  }

  /**
   * Get the client host on request
   * @param req
   */
  protected getClientHost(req: IUserRequest) {
    // this.logger.debug('getClientHost, headers: ', req.headers);
    let host: string;
    if (req.headers.origin) {
      // req comes from shopify theme
      host = (req.headers.origin as string).split('://')[1];
    } else {
      // req from app backend
      host = req.headers.host;
    }
    return host;
  }

  /**
   * Get the shop the req comes from.
   * If a shop string is returned, the req is either from a shop theme or the backend app with logged in user,
   * otherwise null is returend
   *
   * This is method can be used to get the shopifyConnect object because this method only returns the shop on allowed hosts.
   *
   * @param req
   */
  protected getShopSecureForThemeClients(req: IUserRequest): string | null {
    let shop: string;
    const host = this.getClientHost(req);

    this.logger.debug('getShopSecureForThemeClients: %s', host);

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
      // this.logger.debug('preview url', host, (req as any).query);
      shop = this._getMyShopifyDomainUnsecure(req); // WE can secure us the unsecure method here
      this.logger.debug('preview shop', shop);
      return shop;
    }

    // if the host is the host of the app backend the user needs to be logged in
    if (host === this.shopifyModuleOptions.app.host) {
      if (!this.isLoggedIn(req)) {
        return null;
      }
      // the shop domain is the shop domain of the logged in user
      shop = shop = this._getMyShopifyDomainUnsecure(req); // WE can secure us the unsecure method here
      return shop;
    } else {
      // the shop domain is the domain where the req comes from
      shop = host;
    }

    return shop;
  }

  protected _getMyShopifyDomainUnsecure(req: IUserRequest) {
    let shop: string;

    // Get shop from header
    if (req.headers) {
      if (req.headers.shop || req.headers['x-shopify-shop-domain'] || req.headers['X-Shopify-Shop-Domain']) {
        /**
         * Note: You Can set the shop header in the client for each jquery req by:
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
        shop = req.headers.shop as string || req.headers['x-shopify-shop-domain'] as string || req.headers['X-Shopify-Shop-Domain'] as string;
        if (shop.endsWith('.myshopify.com')) {
          return shop;
        }
      }
      // From shopify theme
      if (req.headers.origin) {
        shop = (req.headers as any).origin.split('://')[1];
        if (shop.endsWith('.myshopify.com')) {
          return shop;
        }
      }
    }

    // Get shop from query param
    if (typeof req.query.shop === 'string') {
      shop = req.query.shop;
      if (shop.endsWith('.myshopify.com')) {
        return shop;
      }
    }

    // Fallback
    if (req.session.currentShop) {
      shop = req.session.currentShop;
      if (shop.endsWith('.myshopify.com')) {
        return shop;
      }
    }

    if (!shop) {
      throw new Error('Shop not found! ' + shop);
    }
  }

  /**
   * Unsecure version of getMyShopifyDomainSecureForThemeClients.
   *
   * This also returns the shopify domain if just the shop is set has query param or header param.
   *
   * Do not use this on dangerous authentications like get the shopifyConnect object
   * only if you know what you are doing.
   *
   * @param req
   */
  protected async getMyShopifyDomainUnsecure(req: IUserRequest) {
    const shop = this._getMyShopifyDomainUnsecure(req);

    return this.shopifyConnectService.findByDomain(shop)
    .then((shopifyConnect) => {
      this.logger.debug('getMyShopifyDomain: %s', shopifyConnect.myshopify_domain);
      return shopifyConnect.myshopify_domain;
    });
  }
}
