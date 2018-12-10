import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { TransactionsService, TransactionBaseOptions, TransactionListOptions } from './transactions.service';
import { DebugService } from '../../../debug.service';

import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import { Roles } from '../../../guards/roles.decorator';


@Controller('shopify/api/orders/:order_id/transactions')
export class TransactionsController {
  constructor(
    protected readonly transactionsService: TransactionsService
  ) {};
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  list(@Req() req, @Res() res, @Param('order_id') orderId, @Query() options: TransactionListOptions) {
    return this.transactionsService.list(req.user, orderId, {...options, sync: true})
    .then((transactions) => {
      return res.jsonp(transactions);
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
  count(@Req() req, @Res() res, @Param('order_id') orderId) {
    return this.transactionsService.count(req.user, orderId)
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
  get(@Req() req, @Res() res, @Param('order_id') orderId, @Param('id') id: number, @Query() options: TransactionBaseOptions) {
    return this.transactionsService.get(req.user, orderId, id, options)
    .then((transaction) => {
      return res.jsonp(transaction);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }
}
