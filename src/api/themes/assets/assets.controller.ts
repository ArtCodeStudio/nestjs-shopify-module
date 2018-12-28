import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../../guards/roles.decorator';
import { DebugService } from '../../../debug.service';
import { AssetsService } from './assets.service';
import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import { IShopifyConnect } from '../../../auth/interfaces/connect';
import { IUserRequest } from '../../../interfaces/user-request';
import * as url from 'url';

@Controller('shopify/api/themes')
export class AssetsController {
  constructor(
    protected readonly assetsService: AssetsService
  ) {};

  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Get a list of all assets
   * @param req
   * @param res
   * @param themeId
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':theme_id/assets')
  async listThemeAssets(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('theme_id') themeId: number,
  ) {
    return this.assetsService.list(req.shopifyConnect, themeId)
    .then((assets) => {
      // this.logger.debug(`themes`, assets);
      return res.jsonp(assets);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }

  /**
   * Get asset file by filename
   * @note This is allowed to be used from any user in the theme
   * 
   * @param req
   * @param res
   * @param themeId
   * @param key
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/assets/assets/:filename')
  async getThemeAssetAsset(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('theme_id') themeId: number,
    @Param('filename') filename: string,
  ) {
    const key = 'assets/' + filename;
    return this.assetsService.get(req.shopifyConnect, themeId, key)
    .then((asset) => {
      // this.logger.debug(`asset assets`, asset);
      return res.jsonp(asset);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  }

  /**
   * Get theme template file by filename
   * @note This is allowed to be used from any user in the theme
   * 
   * @param req
   * @param res
   * @param themeId
   * @param key
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/assets/templates/:filename')
  async getThemeAssetTemplate(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('theme_id') themeId: number,
    @Param('filename') filename: string,
  ) {
    const key = 'templates/' + filename;
    return this.assetsService.get(req.shopifyConnect, themeId, key)
    .then((asset) => {
      // this.logger.debug(`asset templates`, asset);
      return res.jsonp(asset);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  }

  /**
   * Get theme snippets file by filename
   * @note This is allowed to be used from any user in the theme
   * 
   * @param req
   * @param res
   * @param themeId
   * @param key
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/assets/snippets/:filename')
  async getThemeAssetSnippets(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('theme_id') themeId: number,
    @Param('filename') filename: string,
  ) {
    const key = 'snippets/' + filename;
    return this.assetsService.get(req.shopifyConnect, themeId, key)
    .then((asset) => {
      // this.logger.debug(`asset snippets`, asset);
      return res.jsonp(asset);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  }

  /**
   * Get any theme file by key path
   * @note For security reasons, this is only allowed from shopify backend (role: shopify-staff-member)
   * 
   * @param req
   * @param res
   * @param themeId
   * @param key
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':theme_id/assets/:key*')
  async getThemeAsset(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('theme_id') themeId: number,
    @Param('key') key: string,
  ) {
    // WORKAROUND to get full key param
    const path = url.parse(req.url).pathname;
    key = path.substring(path.lastIndexOf(key));

    return this.assetsService.get(req.shopifyConnect, themeId, key)
    .then((asset) => {
      // this.logger.debug(`asset`, asset);
      return res.jsonp(asset);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  }
}
