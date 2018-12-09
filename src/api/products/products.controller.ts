import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { ProductsService } from './products.service';
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
  list(@Req() req, @Res() res) {
    return this.productsService.list(req.user)
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
  listAll(@Req() req, @Res() res) {
    return this.productsService.listAll(req.user)
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
  count(@Req() req, @Res() res) {
    return this.productsService.count(req.user)
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
  @Get('sync')
  sync(@Req() req, @Res() res) {
    return this.productsService.count(req.user)
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
}
