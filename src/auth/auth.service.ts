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
import { getSubdomain, getFullMyshopifyDomain } from '../helpers';

@Injectable()
export class ShopifyAuthService {
  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS)
    private readonly shopifyModuleOptions: ShopifyModuleOptions,
    private readonly shopifyConnectService: ShopifyConnectService,
  ) {}
  protected logger = new DebugService('shopify:AuthService');

  /**
   * Alternative for AuthStrategy.oAuthConnect.
   * Used for auth with a clientsite redirect (needed in the shopify iframe).
   * @param req Express request object
   * @param myshopify_domain shop origin, e.g. myshop.myshopify.com
   * @param scopes An optional array of strings or comma-separated string to specify the list of scopes. This allows you to override the default scopes.
   *
   * @see https://help.shopify.com/en/api/embedded-apps/embedded-app-sdk/oauth
   */
  oAuthConnect(
    req: IUserRequest,
    myshopify_domain?: string,
    scopes?: string[],
  ) {
    this.logger.debug(`oAuthConnect for shop ${myshopify_domain}`);
    scopes = scopes || this.shopifyModuleOptions.shopify.scope;

    if (!myshopify_domain) {
      myshopify_domain = this.getShopSecureForThemeClients(req);
    }

    if (!myshopify_domain) {
      throw new Error('myshopify_domain is required');
    }

    const shopifyTokenOptions = {
      sharedSecret: this.shopifyModuleOptions.shopify.clientSecret,
      apiKey: this.shopifyModuleOptions.shopify.clientID,
      scopes: scopes,
      redirectUri: this.shopifyModuleOptions.shopify.iframeCallbackURL,
    };

    const shopifyToken = new ShopifyToken(shopifyTokenOptions);

    const nonce = shopifyToken.generateNonce();
    const shopName = getSubdomain(myshopify_domain);
    const authUrl = shopifyToken.generateAuthUrl(shopName, scopes, nonce);

    this.logger.debug(
      '[oAuthConnect] shopifyTokenOptions: %O',
      shopifyTokenOptions,
    );

    this.logger.debug('[oAuthConnect] nonce: ' + nonce);
    this.logger.debug('[oAuthConnect] authUrl: ' + authUrl);

    return {
      nonce,
      authUrl,
    };
  }

  /**
   * Alternative for AuthStrategy.validate.
   * Used for auth with a clientsite redirect (needed in the shopify iframe).
   * @param shop string
   * @param query { ...[key: string]: string }
   * @param session
   */
  async oAuthCallback(shop: string, query: { [key: string]: any }, session: Session) {
    shop = getFullMyshopifyDomain(shop);
    this.logger.debug(`oAuthCallback for shop ${shop}`);
    const shopifyTokenOptions = {
      sharedSecret: this.shopifyModuleOptions.shopify.clientSecret,
      apiKey: this.shopifyModuleOptions.shopify.clientID,
      scopes: this.shopifyModuleOptions.shopify.scope,
      redirectUri: this.shopifyModuleOptions.shopify.iframeCallbackURL,
    };
    const shopifyToken = new ShopifyToken(shopifyTokenOptions);
    const ok = shopifyToken.verifyHmac(query);

    if (!ok) {
      this.logger.debug(
        '[oAuthCallback] verifyHmac shopifyTokenOptions: %O',
        shopifyTokenOptions,
      );
      this.logger.debug('[oAuthCallback] verifyHmac query: %O', query);
      throw new Error('unauthorized');
    }

    // TODO Fix type on https://github.com/lpinca/shopify-token see https://shopify.dev/tutorials/authenticate-with-oauth
    return (
      shopifyToken.getAccessToken(shop, query.code) as Promise<{
        access_token: string;
        scope: string;
      }>
    ).then(async (res) => {
      this.logger.debug('[getAccessToken] res: %O', res);
      const shops = new Shops(shop, res.access_token);
      return shops.get().then(async (shopObject) => {
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
        return this.shopifyConnectService
          .connectOrUpdate(profile, res.access_token)
          .then((user) => {
            if (!user) {
              throw new Error('Error on connect or update user');
            }
            this.logger.debug(
              `validate user, user.myshopify_domain: "%s"`,
              user.myshopify_domain,
            );
            // Passport stores the user in req.user
            this.logger.debug('\n\nSet user: ', user);
            session[`user-${user.myshopify_domain}`] = user;

            this.logger.debug(
              `session "user-${user.myshopify_domain}"`,
              session[`user-${user.myshopify_domain}`],
            );

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
    this.logger.debug(
      'host: %s app.host: %s',
      host,
      this.shopifyModuleOptions.app.host,
    );
    if (host === this.shopifyModuleOptions.app.host) {
      result.isAppBackendRequest = true;
      return this.getMyShopifyDomainUnsecure(req).then((myshopifyDomain) => {
        if (myshopifyDomain) {
          result.myshopifyDomain = myshopifyDomain;
        }
        return result;
      });
    } else {
      return this.getMyShopifyDomainSecureForThemeClients(req).then(
        (myshopifyDomain) => {
          if (myshopifyDomain && myshopifyDomain.endsWith('.myshopify.com')) {
            result.isThemeClientRequest = true;
            result.myshopifyDomain = myshopifyDomain;
          } else {
            result.isUnknownClientRequest = true;
          }
          return result;
        },
      );
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
      throw new Error(
        '[getMyShopifyDomainSecureForThemeClients] Domain not found! ' +
          anyDomain,
      );
    }
    if (anyDomain.endsWith('.myshopify.com')) {
      return anyDomain;
    }
    return this.shopifyConnectService
      .findByDomain(anyDomain)
      .then((shopifyConnect) => {
        if (!shopifyConnect || !shopifyConnect.myshopify_domain) {
          throw new Error(
            '[getMyShopifyDomainSecureForThemeClients] Shop not found! ' +
              anyDomain,
          );
        }
        this.logger.debug(
          'getMyShopifyDomain: %s',
          shopifyConnect.myshopify_domain,
        );
        return shopifyConnect.myshopify_domain;
      });
  }

  public getShopFromRequest(req: IUserRequest) {
    let shop;
    if (req.headers) {
      shop =
        req.headers['x-shopify-shop-domain'] ||
        req.headers['X-Shopify-Shop-Domain'] ||
        req.headers?.shop ||
        req.headers?.origin?.split('://')[1];
    }

    if (shop?.toString().endsWith('.myshopify.com')) {
      return shop;
    }

    shop = (
      req.shop ||
      req.query?.shop ||
      req.session?.currentShop ||
      req?.params?.shop ||
      ''
    ).toString();

    if (shop?.toString().endsWith('.myshopify.com')) {
      return shop;
    }

    this.logger.debug('Shop not found in request');
    this.logger.debug('headers', req.headers);
    this.logger.debug('params', req.params);
    this.logger.debug('query', req.query);
    this.logger.debug('session', req.session);

    return null;
  }

  /**
   * Check if user is logged in on request
   * @param req
   */
  public isLoggedIn(req: IUserRequest) {
    const shop = this.getShopFromRequest(req);
    if (req.user || req.session[`user-${shop}`]) {
      return true;
    }
    this.logger.debug(
      `is not logged in "${shop}"`,
      req.session[`user-${shop}`],
      req.session,
    );
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

    this.logger.debug('getShopSecureForThemeClients host: %s', host);

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
    this.logger.debug(
      `compare "${host}" with "${this.shopifyModuleOptions.app.host}"`,
    );
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
    const shop = this.getShopFromRequest(req);

    if (!shop) {
      throw new Error('[_getMyShopifyDomainUnsecure] Shop not found! ' + shop);
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
   * @param req
   */
  protected async getMyShopifyDomainUnsecure(req: IUserRequest) {
    const shop = this._getMyShopifyDomainUnsecure(req);

    return this.shopifyConnectService
      .findByDomain(shop)
      .then((shopifyConnect) => {
        if (shopifyConnect && shopifyConnect.myshopify_domain) {
          this.logger.debug(
            'getMyShopifyDomain: %s',
            shopifyConnect.myshopify_domain,
          );
          return shopifyConnect.myshopify_domain || null;
        }
        return null;
      });
  }
}
