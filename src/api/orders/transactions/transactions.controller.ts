import { Controller, Param, Query, UseGuards, Req, Get, HttpStatus, HttpException } from '@nestjs/common';

import { IUserRequest } from '../../../interfaces/user-request';
import { TransactionsService } from './transactions.service';
import { DebugService } from '../../../debug.service';

import { ShopifyApiGuard } from '../../../guards/shopify-api.guard';
import { Roles } from '../../../guards/roles.decorator';

import {
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
    @Param('order_id') orderId: number,
    @Query() options: IShopifySyncTransactionListOptions,
  ) {
    return this.transactionsService.listFromShopify(req.session[`shopify-connect-${req.shop}`], orderId, {
      ...options,
    })
    .catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':order_id/transactions/db')
  async listFromDb(
    @Req() req: IUserRequest,
    @Param('order_id') orderId: number,
  ) {
    try {
      return await this.transactionsService.listFromDb(req.session[`shopify-connect-${req.shop}`], orderId);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':order_id/transactions/count')
  async countFromShopify(
    @Req() req: IUserRequest,
    @Param('order_id') orderId: number,
  ) {
    return this.transactionsService.countFromShopify(req.session[`shopify-connect-${req.shop}`], orderId)
    .catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':order_id/transactions/db/count')
  async countFromDb(
    @Req() req: IUserRequest,
    @Param('order_id') orderId: number,
  ) {
    return this.transactionsService.countFromDb(req.session[`shopify-connect-${req.shop}`], orderId)
    .catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':order_id/transactions/:id/db')
  async getFromDb(
    @Req() req: IUserRequest,
    @Param('id') id: number,
  ) {
    try {
      return await this.transactionsService.getFromDb(req.session[`shopify-connect-${req.shop}`], id);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':order_id/transactions/:id')
  getFromShopify(
    @Req() req: IUserRequest,
    @Param('order_id') orderId,
    @Param('id') id: number,
    @Query() options: IShopifySyncTransactionGetOptions,
  ) {
    return this.transactionsService.getFromShopify(req.session[`shopify-connect-${req.shop}`], orderId, id, options)
    .catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }
}
