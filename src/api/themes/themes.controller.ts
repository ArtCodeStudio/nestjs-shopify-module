import {
  Controller,
  Param,
  UseGuards,
  Req,
  Get,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Roles } from '../../guards/roles.decorator';
import { DebugService } from './../../debug.service';
import { ThemesService } from './themes.service';
import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { IUserRequest } from '../../interfaces/user-request';

@Controller('shopify/api/themes')
export class ThemesController {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(protected readonly themesService: ThemesService) {}

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  getThemes(@Req() req: IUserRequest) {
    const shop = req.session.currentShop || req.shop;
    return this.themesService
      .listFromShopify(req.session[`user-${shop}`])
      .catch((error: Error) => {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('active')
  getActiveTheme(@Req() req) {
    const shop = req.session.currentShop || req.shop;
    return this.themesService
      .getActive(req.session[`user-${shop}`])
      .catch((error: Error) => {
        this.logger.error(error);
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':theme_id')
  getTheme(@Param('theme_id') themeId: number, @Req() req) {
    const shop = req.session.currentShop || req.shop;
    return this.themesService
      .getFromShopify(req.session[`user-${shop}`], themeId)
      .catch((error: Error) => {
        this.logger.error(error);
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }
}
