import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { IUserRequest } from '../../../interfaces/user-request';
import { IShopifyConnect } from '../../../auth/interfaces/connect';
import { TransactionsService, TransactionBaseOptions, TransactionListOptions } from './transactions.service';
import { DebugService } from '../../../debug.service';

import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import { Roles } from '../../../guards/roles.decorator';

@Controller('shopify/api/orders')
export class TransactionsController {
  constructor(
    protected readonly transactionsService: TransactionsService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':order_id/transactions')
  listFromShopify(@Req() req: IUserRequest, @Res() res, @Param('order_id') orderId, @Query() options: TransactionListOptions) {
    return this.transactionsService.listFromShopify(req.shopifyConnect, orderId, {
      ...options,
    })
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
  @Get(':order_id/transactions/synced')
  async listFromDb(@Req() req: IUserRequest, @Param('order_id') orderId, @Res() res) {
    try {
      return res.jsonp(await this.transactionsService.listFromDb(req.shopifyConnect, orderId));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':order_id/transactions/count')
  async countFromShopify(
    @Req() req: IUserRequest,
    @Res() res,
    @Param('order_id') orderId: number,
  ) {
    return this.transactionsService.countFromShopify(req.shopifyConnect, orderId)
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
  @Get(':order_id/transactions/synced/count')
  countFromDb(@Req() req: IUserRequest, @Res() res, @Param('order_id') orderId) {
    return this.transactionsService.countFromDb(req.shopifyConnect, orderId)
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
  @Get(':order_id/transactions/:id/synced')
  async getFromDb(@Req() req: IUserRequest, @Res() res, @Param('id') id: number) {
    try {
      return res.jsonp(await this.transactionsService.getFromDb(req.shopifyConnect, id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':order_id/transactions/:id')
  getFromShopify(
    @Req() req: IUserRequest,
    @Res() res,
    @Param('order_id') orderId,
    @Param('id') id: number,
    @Query() options: TransactionBaseOptions,
  ) {
    return this.transactionsService.getFromShopify(req.shopifyConnect, orderId, id, options)
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
