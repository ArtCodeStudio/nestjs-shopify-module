import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { OrdersService } from './orders.service';
import { DebugService } from 'debug.service';

import { ShopifyApiGuard } from 'shopify/guards/shopify-api.guard';
import { Roles } from 'shopify/guards/roles.decorator';


@Controller('shopify/api/orders')
export class OrdersController {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  list(@Req() req, @Res() res) {
    const ordersService = new OrdersService(req.user.myshopify_domain, req.user.accessToken);

    return ordersService.list()
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
