// nest
import {
  Inject,
  Controller,
  Param,
  UseGuards,
  UseInterceptors,
  Req,
  Get,
  HttpStatus,
  HttpException,
} from '@nestjs/common';

// Third party
import { Infrastructure } from 'shopify-admin-api';
import * as url from 'url';

import { DebugService } from '../../../debug.service';
import { LocalesService } from './locales.service';
import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import { ApiCacheInterceptor } from '../../api-cache.interceptor';
import { IUserRequest } from '../../../interfaces/user-request';
import { SHOPIFY_MODULE_OPTIONS } from '../../../shopify.constants';
import { ShopifyModuleOptions } from '../../../interfaces/shopify-module-options';

@Controller('shopify/api/themes')
@UseInterceptors(ApiCacheInterceptor)
export class LocalesController {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  cache: Cache;

  constructor(
    protected readonly localesService: LocalesService,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    private readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {}

  /**
   * Get all language codes by langcode
   * @param req
   * @param themeId
   * @param filename
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales')
  async getFullLocale(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
  ) {
    return this.localesService
      .get(req.session[`shopify-connect-${req.shop}`], themeId)
      .catch((error: Infrastructure.ShopifyError) => {
        this.logger.error(error);
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
        if (this.shopifyModuleOptions.app.debug && error.stack) {
          errorRes.stack = error.stack;
        }
        throw new HttpException(errorRes, error.statusCode);
      });
  }

  /**
   * Get a list of local files for theme
   * @param req
   * @param themeId
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales/list')
  async listLocales(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
  ) {
    return this.localesService
      .list(req.session[`shopify-connect-${req.shop}`], themeId)
      .catch((error: Infrastructure.ShopifyError) => {
        this.logger.error(error);
        const statusCode = error.statusCode
          ? error.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;
        const errorRes = {
          name: error.name,
          message: error.message,
          statusCode,
          id: themeId,
          stack: undefined,
        };
        if (this.shopifyModuleOptions.app.debug && error.stack) {
          errorRes.stack = error.stack;
        }
        throw new HttpException(errorRes, statusCode);
      });
  }

  /**
   * get locals of theme/locales/*.json
   * @param req
   * @param themeId
   * @param filename
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales/*.json')
  async getLocale(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
    @Param('*.json') filename: string,
  ) {
    // WORKAROUND to get full filename param
    const path = url.parse(req.url).pathname;
    filename = path.substring(path.lastIndexOf('/'));
    return this.localesService
      .getLocalFile(
        req.session[`shopify-connect-${req.shop}`],
        themeId,
        filename,
      )
      .catch((error: Infrastructure.ShopifyError) => {
        this.logger.error(error);
        const statusCode = error.statusCode
          ? error.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;
        if (statusCode === 404) {
          error.message = `Local file ${filename} in theme ${themeId} not found.`;
        }
        const errorRes = {
          name: error.name,
          message: error.message,
          statusCode,
          id: themeId,
          stack: undefined,
        };
        if (this.shopifyModuleOptions.app.debug && error.stack) {
          errorRes.stack = error.stack;
        }
        throw new HttpException(errorRes, statusCode);
      });
  }

  /**
   * Get locals of theme/sections/*.liquid
   * @param req
   * @param themeId
   * @param filename
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales/*.liquid')
  async getSectionLocale(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
    @Param('filename') filename: string,
  ) {
    // WORKAROUND to get full filename param
    const path = url.parse(req.url).pathname;
    filename = path.substring(path.lastIndexOf('/'));

    return this.localesService
      .getSectionFile(
        req.session[`shopify-connect-${req.shop}`],
        themeId,
        filename,
      )
      .catch((error: Infrastructure.ShopifyError) => {
        this.logger.error(error);
        const statusCode = error.statusCode
          ? error.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;
        if (statusCode === 404) {
          error.message = `Section file ${filename} in theme ${themeId} not found.`;
        }
        const errorRes = {
          name: error.name,
          message: error.message,
          statusCode,
          id: themeId,
          filename,
          stack: undefined,
        };
        if (this.shopifyModuleOptions.app.debug && error.stack) {
          errorRes.stack = error.stack;
        }
        throw new HttpException(errorRes, statusCode);
      });
  }

  /**
   * Get all locales or get a subset by iterate into the json e.g. by the language code or deeper
   * @param req
   * @param themeId
   * @param filename
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/locales/:property_path*')
  async getFullLocaleByProperty(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
    @Param('property_path*') propertyPath: string,
  ) {
    const path = url.parse(req.url).pathname;

    const findStr = `${themeId}/locales/`;
    propertyPath = path.substring(path.lastIndexOf(findStr) + findStr.length);
    const properties = propertyPath.split('/');

    return this.localesService
      .get(req.session[`shopify-connect-${req.shop}`], themeId, properties)
      .then((locale) => {
        // this.logger.debug(`assets: %O`, locale);
        if (locale) {
          return locale;
        }
        const error = new Error(
          `Locales with path ${propertyPath} in theme ${themeId} not found.`,
        );
        error.name = 'Not found';
        (error as any).statusCode = 404;
        throw error;
      })
      .catch((error: any) => {
        this.logger.error(error);
        const statusCode = error.statusCode
          ? error.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;
        if (statusCode === 404) {
          error.message = `Locales with path ${propertyPath} in theme ${themeId} not found.`;
        }
        const errorRes = {
          name: error.name,
          message: error.message,
          statusCode,
          id: themeId,
          path,
          stack: undefined,
        };
        if (this.shopifyModuleOptions.app.debug && error.stack) {
          errorRes.stack = error.stack;
        }
        throw new HttpException(errorRes, statusCode);
      });
  }
}
