import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus, Header } from '@nestjs/common';

import { OrdersService, OrderListOptions, OrderCountOptions } from './orders.service';
import { DebugService } from '../../debug.service';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';

import { Readable } from 'stream';


@Controller('shopify/api/orders')
export class OrdersController {
  constructor(
    protected readonly ordersService: OrdersService
  ) {};
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  async list(@Req() req, @Res() res, @Query() options: OrderListOptions) {
    try {
      return res.jsonp(await this.ordersService.listFromShopify(req.user, {...options, status: 'any'}));
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
      return res.jsonp(await this.ordersService.listFromDb(req.user));
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
  @Header('Content-type', 'application/json')
  listAllFromShopify(@Req() req, @Res() res, @Query() options: OrderListOptions) {
    this.ordersService.listAllFromShopifyStream(req.user, {...options, status: 'any'}).pipe(res);
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('synced/count')
  async countFromDb(@Req() req, @Res() res,  @Query() options: OrderCountOptions) {
    try {
      return res.jsonp(await this.ordersService.countFromDb(req.user, options));
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
      return res.jsonp(await this.ordersService.diffSynced(req.user));
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
  async countFromShopify(@Req() req, @Res() res,  @Query() options: OrderCountOptions) {
    try {
      return res.jsonp(await this.ordersService.countFromShopify(req.user, options));
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
      return res.jsonp(await this.ordersService.getFromDb(req.user, id));
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
      return res.jsonp(await this.ordersService.getFromShopify(req.user, id));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
