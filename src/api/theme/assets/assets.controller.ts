import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { Roles } from '../../../guards/roles.decorator';
import { DebugService } from '../../../debug.service';
import { ShopifyThemeAssetService } from './assets.service';
import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import * as url from 'url';

@Controller('shopify/api/themes')
export class AssetsController {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':theme_id/assets')
  async listThemeAssets(
    @Req() req,
    @Res() res,
    @Param('theme_id') themeId: number,
  ) {
    const themeAssetService = new ShopifyThemeAssetService(req.user.myshopify_domain, req.user.accessToken);

    return themeAssetService.list(themeId)
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
    const themeAssetService = new ShopifyThemeAssetService(req.user.myshopify_domain, req.user.accessToken);

    // WORKAROUND to get full key param
    const path = url.parse(req.url).pathname;
    key = path.substring(path.lastIndexOf(key));

    return themeAssetService.get(themeId, key)
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
