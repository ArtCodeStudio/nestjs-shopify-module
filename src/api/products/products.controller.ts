import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { ProductsService } from './products.service';
import { DebugService } from '../../debug.service';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';

@Controller('shopify/api/products')
export class ProductsController {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  list(@Req() req, @Res() res) {
    const productsService = new ProductsService(req.user.myshopify_domain, req.user.accessToken);

    return productsService.list()
    .then((orders) => {
      this.logger.debug(`themes`, orders);
      return res.jsonp(orders);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }
}
