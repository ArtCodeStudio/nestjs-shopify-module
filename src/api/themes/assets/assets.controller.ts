import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { Roles } from '../../../guards/roles.decorator';
import { DebugService } from '../../../debug.service';
import { AssetsService } from './assets.service';
import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import * as url from 'url';

@Controller('shopify/api/themes')
export class AssetsController {
  constructor(
    protected readonly assetsService: AssetsService
  ) {};

  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':theme_id/assets')
  async listThemeAssets(
    @Req() req,
    @Res() res,
    @Param('theme_id') themeId: number,
  ) {
    return this.assetsService.list(req.user, themeId)
    .then((assets) => {
      this.logger.debug(`themes`, assets);
      return res.jsonp(assets);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':theme_id/assets/:key*')
  async getThemeAsset(
    @Req() req,
    @Res() res,
    @Param('theme_id') themeId: number,
    @Param('key') key: string,
  ) {
    // WORKAROUND to get full key param
    const path = url.parse(req.url).pathname;
    key = path.substring(path.lastIndexOf(key));

    return this.assetsService.get(req.user, themeId, key)
    .then((asset) => {
      this.logger.debug(`asset`, asset);
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
