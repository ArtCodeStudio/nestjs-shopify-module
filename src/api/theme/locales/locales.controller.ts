import { Controller, Param, UseGuards, Req, Res, Get, HttpStatus, UseInterceptors } from '@nestjs/common';

import { Roles } from 'shopify/guards/roles.decorator';
import { DebugService } from 'debug.service';
import { ShopifyLocalesService } from 'shopify/api/theme/locales/shopify-locales.service';
import { ShopifyApiGuard } from 'shopify/guards/shopify-api.guard';
import { ShopifyConnectService } from 'shopify/auth/connect.service';
import { IShopifyConnect } from 'shopify/auth/interfaces/connect';
import { ApiCacheInterceptor } from 'shopify/api/api-cache.interceptor';
import { ShopifyError } from 'shopify-prime/infrastructure/shopify_error';

import * as url from 'url';

// WORKAROUND for https://github.com/nestjs/nest/issues/1016
import * as cacheManager from 'cache-manager';
import { ConfigService } from 'config.service';
import { Cache } from '../../api-cache.d';

@Controller('shopify/api/themes')
// WAIT FOR FIX https://github.com/nestjs/nest/issues/1016
// @UseInterceptors(ApiCacheInterceptor)
export class LocalesController {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  // WORKAROUND for https://github.com/nestjs/nest/issues/1016
  redisCache: Cache = cacheManager.caching(ConfigService.cache) as any as Cache;

  constructor(private readonly shopifyConnectService: ShopifyConnectService) {
  }

  /**
   * Get all language codes by langcode
   * @param req
   * @param res
   * @param themeId
   * @param filename
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales')
  async getFullLocale(
    @Req() req,
    @Res() res,
    @Param('theme_id') themeId: number,
  ) {
    const shopifyConnect = (req.shopifyConnect as IShopifyConnect);
    // WORKAROUND for https://github.com/nestjs/nest/issues/1016
    const key = JSON.stringify({name: `shopify/api/themes/${themeId}`, myshopify_domain: shopifyConnect.shop.myshopify_domain});
    return this.redisCache.wrap<any>(key, () => {
      const localesService = new ShopifyLocalesService(shopifyConnect.shop.myshopify_domain, shopifyConnect.accessToken);
      return localesService.get(themeId);
    })
    .then((locale) => {
      this.logger.debug(`assets`, locale);
      return res.jsonp(locale);
    })
    .catch((error: ShopifyError) => {
      this.logger.debug(error);
      if (error.statusCode === 404) {
        error.message = `Locales in theme ${themeId} not found.`;
      }
      if (!error.statusCode) {
        error.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      }
      const errorRes = {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        id: themeId,
        stack: undefined,
      };
      if (ConfigService.app.debug && error.stack) {
        errorRes.stack = error.stack;
      }
      return res.status(error.statusCode).jsonp(errorRes);
    });
  }

  /**
   * Get a list of local files for theme
   * @param req
   * @param res
   * @param themeId
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales/list')
  async listLocales(
    @Req() req,
    @Res() res,
    @Param('theme_id') themeId: number,
  ) {
    const shopifyConnect = (req.shopifyConnect as IShopifyConnect);
    const localesService = new ShopifyLocalesService(shopifyConnect.shop.myshopify_domain, shopifyConnect.accessToken);
    return localesService.list(themeId)
    .then((assets) => {
      return res.jsonp(assets);
    })
    .catch((error: ShopifyError) => {
      this.logger.error(error);
      const errorRes = {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        id: themeId,
        stack: undefined,
      };
      if (ConfigService.app.debug && error.stack) {
        errorRes.stack = error.stack;
      }
      return res.status(error.statusCode).jsonp(errorRes);
    });
  }

  /**
   * get locals of theme/locales/*.json
   * @param req
   * @param res
   * @param themeId
   * @param filename
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales/*.json')
  async getLocale(
    @Req() req,
    @Res() res,
    @Param('theme_id') themeId: number,
    @Param('*.json') filename: string,
  ) {
    const shopifyConnect = (req.shopifyConnect as IShopifyConnect);
    const localesService = new ShopifyLocalesService(shopifyConnect.shop.myshopify_domain, shopifyConnect.accessToken);

    // WORKAROUND to get full filename param
    const path = url.parse(req.url).pathname;
    filename = path.substring(path.lastIndexOf('/'));
    return localesService.getLocalFile(themeId, filename)
    .then((locale) => {
      this.logger.debug(`assets`, locale);
      return res.jsonp(locale);
    })
    .catch((error: ShopifyError) => {
      this.logger.error(error);
      if (error.statusCode === 404) {
        error.message = `Local file ${filename} in theme ${themeId} not found.`;
      }
      const errorRes = {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        id: themeId,
        stack: undefined,
      };
      if (ConfigService.app.debug && error.stack) {
        errorRes.stack = error.stack;
      }
      return res.status(error.statusCode).jsonp(errorRes);
    });
  }

  /**
   * Get locals of theme/sections/*.liquid
   * @param req
   * @param res
   * @param themeId
   * @param filename
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales/*.liquid')
  async getSectionLocale(
    @Req() req,
    @Res() res,
    @Param('theme_id') themeId: number,
    @Param('filename') filename: string,
  ) {
    const shopifyConnect = (req.shopifyConnect as IShopifyConnect);
    const localesService = new ShopifyLocalesService(shopifyConnect.shop.myshopify_domain, shopifyConnect.accessToken);

    // WORKAROUND to get full filename param
    const path = url.parse(req.url).pathname;
    filename = path.substring(path.lastIndexOf('/'));

    return localesService.getSectionFile(themeId, filename)
    .then((locale) => {
      this.logger.debug(`assets`, locale);
      return res.jsonp(locale);
    })
    .catch((error: ShopifyError) => {
      this.logger.error(error);
      if (error.statusCode === 404) {
        error.message = `Section file ${filename} in theme ${themeId} not found.`;
      }
      const errorRes = {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        id: themeId,
        filename,
        stack: undefined,
      };
      if (ConfigService.app.debug && error.stack) {
        errorRes.stack = error.stack;
      }
      return res.status(error.statusCode).jsonp(errorRes);
    });
  }

  /**
   * Get all locales or get a subset by iterate into the json e.g. by the language code or deeper
   * @param req
   * @param res
   * @param themeId
   * @param filename
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales/:property_path*')
  async getFullLocaleByProperty(
    @Req() req,
    @Res() res,
    @Param('theme_id') themeId: number,
    @Param('property_path*') propertyPath: string,
  ) {

    const path = url.parse(req.url).pathname;
    const shopifyConnect = (req.shopifyConnect as IShopifyConnect);

    // WORKAROUND for https://github.com/nestjs/nest/issues/1016
    const key = JSON.stringify({name: path, myshopify_domain: shopifyConnect.myshopify_domain});

    return this.redisCache.wrap<any>(key, () => {
      // WORKAROUND to get full filename param
      const findStr = `${themeId}/locales/`;
      propertyPath = path.substring(path.lastIndexOf(findStr) + findStr.length);
      const properties = propertyPath.split('/');

      const localesService = new ShopifyLocalesService(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
      return localesService.get(themeId, properties);
    })
    .then((locale) => {
      this.logger.debug(`assets`, locale);
      if (locale) {
        return res.jsonp(locale);
      }
      const error = new Error(`Locales with path ${propertyPath} in theme ${themeId} not found.`);
      error.name = 'Not found';
      (error as any).statusCode = 404;
      throw error;
    })
    .catch((error: ShopifyError) => {
      this.logger.error(error);
      if (error.statusCode === 404) {
        error.message = `Locales with path ${propertyPath} in theme ${themeId} not found.`;
      }
      const errorRes = {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        id: themeId,
        path,
        stack: undefined,
      };
      if (ConfigService.app.debug && error.stack) {
        errorRes.stack = error.stack;
      }
      return res.status(error.statusCode).jsonp(errorRes);
    });
  }

}
