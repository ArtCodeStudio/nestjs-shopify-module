import { Controller, UseGuards, Req, Res, Get, HttpStatus, Query } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../guards/roles.decorator';
import { ExtProductsService } from './products.service';
import { DebugService } from '../../debug.service';
import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { IUserRequest } from '../../interfaces/user-request';
import { RolesGuard } from '../../guards/roles.guard';

@Controller('shopify/api-ext/products')
export class ExtProductsController {
  constructor(
    protected readonly extProductsService: ExtProductsService,
  ) {}

  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Get a list of all publications
   * @param req
   * @param res
   * @param themeId
   */
  @UseGuards(ShopifyApiGuard, RolesGuard)
  @Roles() // Also allowed from shop frontend
  @Get('scheduled')
  async listScheduled(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query("tag") tag = "*",
    @Query("limit") limit = 50
  ) {
    try {
      const products = await this.extProductsService.listScheduled(req.session[`shopify-connect-${req.shop}`], {
        limit,
        tag
      });
      return res.jsonp(products);
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

    /**
   * Get a list of all publications
   * @param req
   * @param res
   * @param themeId
   */
  @UseGuards(ShopifyApiGuard, RolesGuard)
  @Roles() // Also allowed from shop frontend
  @Get('preview')
  async getPreview(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query("id") id,
  ) {
    try {
      const products = await this.extProductsService.getPreview(req.session[`shopify-connect-${req.shop}`], {
        id
      });
      return res.jsonp(products);
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
