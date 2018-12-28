import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../guards/roles.decorator';
import { DebugService } from 'debug.service';
import { ThemesService } from './themes.service';
import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { IUserRequest } from '../../interfaces/user-request';
import { IShopifyConnect } from '../../auth/interfaces/connect';

@Controller('shopify/api/themes')
export class ThemesController {

  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    protected readonly themesService: ThemesService
  ) {  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  getThemes(
    @Req() req: IUserRequest,
    @Res() res: Response,
  ) {
    this.themesService.list(req.user)
    .then((themes) => {
      // this.logger.debug(`themes`, themes);
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
  @Get('active')
  getActiveTheme(
    @Req() req,
    @Res() res: Response,
  ) {
    this.themesService.getActive(req.user)
    .then((theme) => {
      // this.logger.debug(`theme`, theme);
      return res.jsonp(theme);
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
    @Res() res: Response,
  ) {
    this.themesService.get(req.user, themeId)
    .then((theme) => {
      // this.logger.debug(`theme`, theme);
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
