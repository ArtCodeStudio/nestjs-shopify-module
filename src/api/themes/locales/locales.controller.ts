import { Inject, Controller, Param, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { Roles } from '../../../guards/roles.decorator';
import { DebugService } from '../../../debug.service';
import { LocalesService } from './locales.service';
import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import { ShopifyConnectService } from '../../../auth/connect.service';
import { IShopifyConnect } from '../../../auth/interfaces/connect';
import { Infrastructure } from 'shopify-prime';

import { SHOPIFY_MODULE_OPTIONS } from '../../../shopify.constants';
import { ShopifyModuleOptions } from '../../../interfaces/shopify-module-options';

import * as url from 'url';

// WORKAROUND for https://github.com/nestjs/nest/issues/1016
import * as cacheManager from 'cache-manager';
import { Cache } from '../../api-cache.d';

@Controller('shopify/api/themes')
// WAIT FOR FIX https://github.com/nestjs/nest/issues/1016
// @UseInterceptors(ApiCacheInterceptor)
export class LocalesController {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  // WORKAROUND for https://github.com/nestjs/nest/issues/1016
  redisCache: Cache = cacheManager.caching(this.shopifyModuleOptions.cache) as any as Cache;

  constructor(
    protected readonly localesService: LocalesService,
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
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
      return this.localesService.get(req.user, themeId);
    })
    .then((locale) => {
      this.logger.debug(`assets`, locale);
      return res.jsonp(locale);
    })
    .catch((error: Infrastructure.ShopifyError) => {
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
      if (this.shopifyModuleOptions.debug && error.stack) {
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
    this.localesService.list(req.user, themeId)
    .then((assets) => {
      return res.jsonp(assets);
    })
    .catch((error: Infrastructure.ShopifyError) => {
      this.logger.error(error);
      const statusCode = error.statusCode ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
      const errorRes = {
        name: error.name,
        message: error.message,
        statusCode: statusCode,
        id: themeId,
        stack: undefined,
      };
      if (this.shopifyModuleOptions.debug && error.stack) {
        errorRes.stack = error.stack;
      }
      return res.status(statusCode).jsonp(errorRes);
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
    // WORKAROUND to get full filename param
    const path = url.parse(req.url).pathname;
    filename = path.substring(path.lastIndexOf('/'));
    return this.localesService.getLocalFile(req.user, themeId, filename)
    .then((locale) => {
      this.logger.debug(`assets`, locale);
      return res.jsonp(locale);
    })
    .catch((error: Infrastructure.ShopifyError) => {
      this.logger.error(error);
      const statusCode = error.statusCode ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
      if (statusCode === 404) {
        error.message = `Local file ${filename} in theme ${themeId} not found.`;
      }
      const errorRes = {
        name: error.name,
        message: error.message,
        statusCode: statusCode,
        id: themeId,
        stack: undefined,
      };
      if (this.shopifyModuleOptions.debug && error.stack) {
        errorRes.stack = error.stack;
      }
      return res.status(statusCode).jsonp(errorRes);
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
    // WORKAROUND to get full filename param
    const path = url.parse(req.url).pathname;
    filename = path.substring(path.lastIndexOf('/'));

    return this.localesService.getSectionFile(req.user, themeId, filename)
    .then((locale) => {
      this.logger.debug(`assets`, locale);
      return res.jsonp(locale);
    })
    .catch((error: Infrastructure.ShopifyError) => {
      this.logger.error(error);
      const statusCode = error.statusCode ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
      if (statusCode === 404) {
        error.message = `Section file ${filename} in theme ${themeId} not found.`;
      }
      const errorRes = {
        name: error.name,
        message: error.message,
        statusCode: statusCode,
        id: themeId,
        filename,
        stack: undefined,
      };
      if (this.shopifyModuleOptions.debug && error.stack) {
        errorRes.stack = error.stack;
      }
      return res.status(statusCode).jsonp(errorRes);
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

      return this.localesService.get(req.user, themeId, properties);
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
    .catch((error: Infrastructure.ShopifyError) => {
      this.logger.error(error);
      const statusCode = error.statusCode ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
      if (statusCode === 404) {
        error.message = `Locales with path ${propertyPath} in theme ${themeId} not found.`;
      }
      const errorRes = {
        name: error.name,
        message: error.message,
        statusCode: statusCode,
        id: themeId,
        path,
        stack: undefined,
      };
      if (this.shopifyModuleOptions.debug && error.stack) {
        errorRes.stack = error.stack;
      }
      return res.status(statusCode).jsonp(errorRes);
    });
  }

}
