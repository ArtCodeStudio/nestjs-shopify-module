import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { Roles } from 'shopify/guards/roles.decorator';
import { DebugService } from 'debug.service';
import { ShopifyThemeService } from 'shopify/api/theme/theme.service';
import { ShopifyThemeAssetService } from 'shopify/api/theme/assets/assets.service';
import { ShopifyApiGuard } from 'shopify/guards/shopify-api.guard';

@Controller('shopify/api/themes')
export class ThemeController {

  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor() {
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  getThemes(
    @Req() req,
    @Res() res,
  ) {
    const themeService = new ShopifyThemeService(req.user.myshopify_domain, req.user.accessToken);

    return themeService.list()
    .then((themes) => {
      this.logger.debug(`themes`, themes);
      return res.jsonp(themes);
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
  @Get(':theme_id')
  getTheme(
    @Param('theme_id') themeId: number,
    @Req() req,
    @Res() res,
  ) {
    const themeService = new ShopifyThemeService(req.user.myshopify_domain, req.user.accessToken);

    return themeService.get(themeId)
    .then((theme) => {
      this.logger.debug(`theme`, theme);
      return res.jsonp(theme);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }

}
