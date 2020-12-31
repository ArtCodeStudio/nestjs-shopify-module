import { Controller, Param, UseGuards, Req, Get, HttpStatus, HttpException } from '@nestjs/common';
import { Roles } from '../../../guards/roles.decorator';
import { DebugService } from '../../../debug.service';
import { AssetsService } from './assets.service';
import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import { IUserRequest } from '../../../interfaces/user-request';
import * as url from 'url';

@Controller('shopify/api/themes')
export class AssetsController {
  constructor(
    protected readonly assetsService: AssetsService,
  ) {}

  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Get a list of all assets
   * @param req
   * @param themeId
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':theme_id/assets')
  async listThemeAssets(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
  ) {
    return this.assetsService.list(req.session[`shopify-connect-${req.shop}`], themeId)
    .catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  /**
   * Get asset file by filename
   * @note This is allowed to be used from any user in the theme
   *
   * @param req
   * @param themeId
   * @param key
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/assets/assets/:filename')
  async getThemeAssetAsset(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
    @Param('filename') filename: string,
  ) {
    const key = 'assets/' + filename;
    return this.assetsService.get(req.session[`shopify-connect-${req.shop}`], themeId, key)
    .catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  /**
   * Get theme template file by filename
   * @note This is allowed to be used from any user in the theme
   *
   * @param req
   * @param themeId
   * @param key
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/assets/templates/:filename')
  async getThemeAssetTemplate(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
    @Param('filename') filename: string,
  ) {
    const key = 'templates/' + filename;
    return this.assetsService.get(req.session[`shopify-connect-${req.shop}`], themeId, key)
    .catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  /**
   * Get theme snippets file by filename
   * @note This is allowed to be used from any user in the theme
   *
   * @param req
   * @param themeId
   * @param key
   */
  @UseGuards(ShopifyApiGuard)
  @Get(':theme_id/assets/snippets/:filename')
  async getThemeAssetSnippets(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
    @Param('filename') filename: string,
  ) {
    const key = 'snippets/' + filename;
    return this.assetsService.get(req.session[`shopify-connect-${req.shop}`], themeId, key)
    .catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  /**
   * Get any theme file by key path
   * @note For security reasons, this is only allowed from shopify backend (role: shopify-staff-member)
   *
   * @param req
   * @param themeId
   * @param key
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':theme_id/assets/:key*')
  async getThemeAsset(
    @Req() req: IUserRequest,
    @Param('theme_id') themeId: number,
    @Param('key') key: string,
  ) {
    // WORKAROUND to get full key param
    const path = url.parse(req.url).pathname;
    key = path.substring(path.lastIndexOf(key));

    return this.assetsService.get(req.session[`shopify-connect-${req.shop}`], themeId, key)
    .catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }
}
