import {
  Inject,
  Controller,
  Get,
  Req,
  Res,
  Next,
  Session,
  Query,
  Param,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';

import { Response } from 'express';
import { IUserRequest } from '../interfaces/user-request';
import { Session as IUserSession } from '../interfaces/session';

import { PassportStatic } from 'passport';
import { ShopifyAuthStrategy } from './auth.strategy';
import { ShopifyConnectService } from './connect.service';
import { ShopifyAuthService } from './auth.service';
import { DebugService } from '../debug.service';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { SHOPIFY_MODULE_OPTIONS } from '../shopify.constants';

/**
 * TODO also use time link in this example? https://github.com/danteata/passport-shopify/blob/master/example/dynamic/app.jsy
 */

import { Roles } from '../guards/roles.decorator';
@Controller('shopify/auth')
export class ShopifyAuthController {
  protected logger = new DebugService('shopify:AuthController');

  constructor(
    private readonly shopifyConnectService: ShopifyConnectService,
    private readonly shopifyAuthService: ShopifyAuthService,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    private readonly shopifyModuleOptions: ShopifyModuleOptions,
    @Inject('Passport') private readonly passport: PassportStatic,
  ) {}

  /**
   * Starts the OAuth flow to connect this app with shopify
   * @param res
   * @param req
   */
  @Get()
  oAuthConnect(
    @Query('shop') shop,
    @Query('scope') scope,
    @Param('shop') shopParam: string,
    @Body('shop') shopBody: string,
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Next() next,
    @Session() session: IUserSession,
  ) {
    shop =
      shop ||
      shopParam ||
      shopBody ||
      this.shopifyAuthService.getShopFromRequest(req);
    if (typeof shop !== 'string') {
      return res.send(
        'shop was not a string, e.g. /auth/shopify?shop=your-shop-name',
      );
    }

    // Logout if the user is logged in another shop
    req.logout();

    session.currentShop = shop;
    req.shop = shop;

    this.logger.debug(
      'auth called: %s',
      `AuthController:${shop}`,
      `Scope:${scope}`,
      `Query:${JSON.stringify(req.query)}`,
    );

    const shopifyAuthStrategy = new ShopifyAuthStrategy(
      shop,
      this.shopifyConnectService,
      this.shopifyModuleOptions,
      this.passport,
    );
    this.passport.use(`shopify-${shop}`, shopifyAuthStrategy);

    this.logger.debug('this.passport.use', `shopify-${shop}`);

    return this.passport.authenticate(`shopify-${shop}`, {
      failureRedirect: `/shopify/auth/failure/${shop}`,
      successRedirect: `/shopify/auth/success/${shop}`,
      scope: scope || this.shopifyModuleOptions.shopify.scope,
      shop,
      failureFlash: true, // optional, see text as well
    } as any)(req, res, next);
  }

  /**
   * Alternative for route 'shopify/auth'
   * Used for auth with a clientsite redirect (needed in the shopify iframe).
   * @param shop
   * @param req
   * @param session
   */
  @Get('/iframe')
  oAuthConnectIframe(
    @Query('shop') shop: string,
    @Param('shop') shopParam: string,
    @Body('shop') shopBody: string,
    @Req() req: IUserRequest,
    @Session() session: IUserSession,
  ) {
    shop =
      shop ||
      shopParam ||
      shopBody ||
      (req.headers.shop as string) ||
      (req.headers['x-shopify-shop-domain'] as string) ||
      (req.headers['X-Shopify-Shop-Domain'] as string);
    if (typeof shop !== 'string') {
      throw new HttpException(
        'shop was not a string, e.g. /auth/shopify?shop=your-shop-name',
        HttpStatus.BAD_REQUEST,
      );
    }

    session.currentShop = shop;
    req.shop = shop;

    const oAuthConnect = this.shopifyAuthService.oAuthConnect(req, shop);
    session.nonce = oAuthConnect.nonce;

    return { authUrl: oAuthConnect.authUrl };
  }

  /**
   * Alternative for route 'shopify/auth/callback'
   * Used for auth with a clientsite auth (needed in the shopify iframe).
   * @param shop
   * @param code
   * @param hmac
   * @param state The generated nonce
   * @param timestamp
   * @param req
   * @param res
   * @param next
   * @param session
   */
  @Get('callback/iframe')
  async oAuthConnectIframeCallback(
    @Query() query,
    @Param('shop') shopParam: string,
    @Body('shop') shopBody: string,
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Session() session: IUserSession,
  ) {
    shop =
      shop ||
      shopParam ||
      shopBody ||
      (req.headers['x-shopify-shop-domain'] as string) ||
      (req.headers['X-Shopify-Shop-Domain'] as string);
    if (typeof shop !== 'string') {
      throw new HttpException(
        'shop was not a string, e.g. /auth/shopify?shop=your-shop-name',
        HttpStatus.BAD_REQUEST,
      );
    }

    session.currentShop = shop;
    req.shop = shop;

    if (query.state !== session.nonce) {
      this.logger.warn(`Wrong state / nonce!`);
      return false;
    }

    if (
      typeof query.hmac !== 'string' ||
      Buffer.byteLength(query.hmac) !== 64
    ) {
      this.logger.warn(`Wrong hmac type or length!`);
      return false;
    }

    try {
      await this.shopifyAuthService.oAuthCallback(shop, query, session);
      this.logger.debug(`Redirect to /view/settings?shop=${shop}`);
      session.nonce = undefined;
      return res.redirect(`/view/settings?shop=${shop}`);
    } catch (error) {
      console.error(error);
      return res.redirect(`/shopify/auth/failure/${shop}`);
    }
  }

  /**
   * OAuth shopify callback
   * @param shop
   * @param req
   * @param res
   * @param next
   * @param session
   */
  @Get('/callback')
  callback(
    @Query('shop') shop: string,
    @Param('shop') shopParam: string,
    @Req() req,
    @Res() res,
    @Next() next,
    @Session() session: IUserSession,
  ) {
    shop = shop || shopParam;
    if (typeof shop !== 'string') {
      throw new HttpException(
        'shop query param not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    session.currentShop = shop;
    req.shop = shop;

    this.logger.debug('callback called: %s', `AuthController:${shop}`);

    return this.passport.authenticate(`shopify-${shop}`, {
      failureRedirect: `/shopify/auth/failure/${shop}`,
      successRedirect: `/shopify/auth/success/${shop}`,
      failureFlash: true, // optional, see text as well
      session: true,
    })(req, res, next);
  }

  /**
   * Called if OAuth was success
   * @param shop
   * @param res
   * @param session
   */
  @Get('/success/:shop')
  success(
    @Param('shop') shop,
    @Res() res: Response,
    @Session() session: IUserSession,
  ) {
    this.logger.debug(
      `success for shop "${shop}", is logged in: ${!!session['user-' + shop]}`,
    );

    // For fallback if no shop is set in request.headers
    this.passport.unuse(`shopify-${shop}`);

    // Redirect to view TODO get this from config
    return res.redirect('/view/settings');
  }

  /**
   * Called if OAuth fails
   * @param shop
   */
  @Get('/failure/:shop')
  failure(@Param('shop') shop) {
    this.passport.unuse(`shopify-${shop}`);
    throw new HttpException(
      `Failure on oauth autentification`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Get a list of all connected shopify accounts
   */
  @Get('/connected')
  @Roles('admin')
  async connects() {
    return this.shopifyConnectService.findAll().catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(
        `Failure on get connected shopify accounts`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  }

  /**
   * Get connected shopify account by current user
   * TODO return multiple accounts if req.session.shops has multiple shops?
   * @param req
   */
  @Get('/connected/current')
  @Roles('shopify-staff-member')
  async connectCurrent(@Req() req: IUserRequest) {
    const shop = req.session.currentShop || req.shop;
    this.logger.debug('get /connected/current');
    return this.shopifyConnectService
      .findByDomain(shop)
      .catch((error: Error) => {
        this.logger.error(
          'Failure on getting connected shopify account:',
          error,
        );
        throw new HttpException(
          {
            message: `Failure on get connected shopify account.`,
            info: error.message,
            name: error.name,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  /**
   * Get a connected shopify account by id
   * @param id
   */
  @Get('/connected/:id')
  @Roles('admin')
  async connect(@Param('id') id) {
    return this.shopifyConnectService
      .findByShopifyId(Number(id))
      .catch((error: Error) => {
        this.logger.error(error);
        throw new HttpException(
          {
            message: `Failure on get connected shopify account with id ${id}.`,
            info: error.message,
            name: error.name,
            id,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  @Get('/logout')
  @Roles('shopify-staff-member')
  logout(@Res() res: Response, @Req() req: IUserRequest) {
    if (typeof req.logout === 'function') {
      req.logout();
    }
    for (const shop of req.session.shops) {
      delete req.session[`user-${shop}`];
    }
    return res.redirect('/view'); // TODO change url and store them in config
  }

  /**
   * Check if the current user (the request comes from) is logged in
   * @param req
   */
  @Get('/loggedIn')
  loggedIn(@Req() req: IUserRequest) {
    return this.shopifyAuthService.isLoggedIn(req);
  }
}
