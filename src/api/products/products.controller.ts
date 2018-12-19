import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { ProductsService, ProductListOptions, ProductCountOptions } from './products.service';
import { DebugService } from '../../debug.service';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';
import { Readable } from 'stream';


@Controller('shopify/api/products')
export class ProductsController {
  constructor(
    protected readonly productsService: ProductsService
  ) {};
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  async list(@Req() req, @Res() res, @Query() options: ProductListOptions) {
    try {
      return res.jsonp(await this.productsService.listFromShopify(req.user, {...options}));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @Get('synced')
  async listFromDb(@Req() req, @Res() res) {
    try {
      return res.jsonp(await this.productsService.listFromDb(req.user));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('all')
  listAllFromShopify(@Req() req, @Query() options: ProductListOptions): Readable {
    return this.productsService.listAllFromShopifyStream(req.user, {...options});
  }


  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('synced/count')
  async countFromDb(@Req() req, @Res() res,  @Query() options: ProductCountOptions) {
    try {
      return res.jsonp(await this.productsService.countFromDb(req.user, options));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('synced/diff')
  async diffSynced(@Req() req, @Res() res) {
    try {
      return res.jsonp(await this.productsService.diffSynced(req.user));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }


  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('count')
  async countFromShopify(@Req() req, @Res() res,  @Query() options: ProductCountOptions) {
    try {
      return res.jsonp(await this.productsService.countFromShopify(req.user, options));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('synced/:id')
  async getFromDb(@Req() req, @Res() res, @Param('id') id: number) {
    try {
      return res.jsonp(await this.productsService.getFromDb(req.user, id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':id')
  async getFromShopify(@Req() req, @Res() res, @Param('id') id: number) {
    try {
      return res.jsonp(await this.productsService.getFromShopify(req.user, id));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
