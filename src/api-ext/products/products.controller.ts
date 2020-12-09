import { Controller, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../guards/roles.decorator';
import { ExtProductsService } from './products.service';
import { DebugService } from '../../debug.service';
import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { IUserRequest } from '../../interfaces/user-request';

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
  @UseGuards(ShopifyApiGuard)
  @Roles() // Also allowed from shop frontend
  @Get('publications')
  async listPublications(
    @Req() req: IUserRequest,
    @Res() res: Response,
  ) {
    try {
      const products = await this.extProductsService.listPublications(req.session[`shopify-connect-${req.shop}`], {})
      return res.jsonp(products);
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
