import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { OrdersService, OrderListOptions, OrderCountOptions } from './orders.service';
import { DebugService } from '../../debug.service';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';


@Controller('shopify/api/orders')
export class OrdersController {
  constructor(
    protected readonly ordersService: OrdersService
  ) {};
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  list(@Req() req, @Res() res, @Query() options: OrderListOptions) {
    return this.ordersService.list(req.user, {...options, sync: true, status: 'any'})
    .then((orders) => {
      return res.jsonp(orders);
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
  listAll(@Req() req, @Res() res, @Query() options: OrderListOptions) {
    return this.ordersService.listAll(req.user, {...options, sync: true, status: 'any'})
    .then((orders) => {
      return res.jsonp(orders);
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
  count(@Req() req, @Res() res,  @Query() options: OrderCountOptions) {
    return this.ordersService.count(req.user, options)
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
    return this.ordersService.get(req.user, id)
    .then((order) => {
      return res.jsonp(order);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }
}
