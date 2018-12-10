import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { ProductsService, ProductListOptions, ProductCountOptions } from './products.service';
import { DebugService } from '../../debug.service';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';


@Controller('shopify/api/products')
export class ProductsController {
  constructor(
    protected readonly productsService: ProductsService
  ) {};
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  list(@Req() req, @Res() res, @Query() options: ProductListOptions) {
    return this.productsService.list(req.user, {...options, sync: true})
    .then((products) => {
      return res.jsonp(products);
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
  @Get('all')
  listAll(@Req() req, @Res() res, @Query() options: ProductListOptions) {
    return this.productsService.listAll(req.user, {...options, sync: true})
    .then((products) => {
      return res.jsonp(products);
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
  @Get('count')
  count(@Req() req, @Res() res,  @Query() options: ProductCountOptions) {
    return this.productsService.count(req.user, options)
    .then((count) => {
      return res.jsonp(count);
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
  @Get(':id')
  get(@Req() req, @Res() res, @Param('id') id: number) {
    return this.productsService.get(req.user, id)
    .then((product) => {
      return res.jsonp(product);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }
}
