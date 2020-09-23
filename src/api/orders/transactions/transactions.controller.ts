import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { IUserRequest } from '../../../interfaces/user-request';
import { IShopifyConnect } from '../../../auth/interfaces/connect';
import { TransactionsService } from './transactions.service';
import { DebugService } from '../../../debug.service';

import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import { Roles } from '../../../guards/roles.decorator';

import {
  IAppTransactionCountOptions,
  IAppTransactionGetOptions,
  IAppTransactionListOptions,
  IShopifySyncTransactionCountOptions,
  IShopifySyncTransactionGetOptions,
  IShopifySyncTransactionListOptions,
} from '../../interfaces';

@Controller('shopify/api/orders')
export class TransactionsController {
  constructor(
    protected readonly transactionsService: TransactionsService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':order_id/transactions')
  async listFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('order_id') orderId: number,
    @Query() options: IShopifySyncTransactionListOptions,
  ) {
    return this.transactionsService.listFromShopify(req.session[`shopify-connect-${req.shop}`], orderId, {
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
  @Get(':order_id/transactions/db')
  async listFromDb(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('order_id') orderId: number,
  ) {
    try {
      return res.jsonp(await this.transactionsService.listFromDb(req.session[`shopify-connect-${req.shop}`], orderId));
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
    @Res() res: Response,
    @Param('order_id') orderId: number,
  ) {
    return this.transactionsService.countFromShopify(req.session[`shopify-connect-${req.shop}`], orderId)
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
  @Get(':order_id/transactions/db/count')
  async countFromDb(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('order_id') orderId: number,
  ) {
    return this.transactionsService.countFromDb(req.session[`shopify-connect-${req.shop}`], orderId)
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
  @Get(':order_id/transactions/:id/db')
  async getFromDb(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    try {
      return res.jsonp(await this.transactionsService.getFromDb(req.session[`shopify-connect-${req.shop}`], id));
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
    @Res() res: Response,
    @Param('order_id') orderId,
    @Param('id') id: number,
    @Query() options: IShopifySyncTransactionGetOptions,
  ) {
    return this.transactionsService.getFromShopify(req.session[`shopify-connect-${req.shop}`], orderId, id, options)
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
