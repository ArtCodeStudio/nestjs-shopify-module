import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus, Header } from '@nestjs/common';
import { Response } from 'express';

import { OrdersService } from './orders.service';
import { DebugService } from '../../debug.service';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';

import { Readable } from 'stream';

// Interfaces
import { IUserRequest } from '../../interfaces/user-request';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import {
  IAppOrderCountOptions,
  IAppOrderGetOptions,
  IAppOrderListOptions,
  IShopifySyncOrderCountOptions,
  IShopifySyncOrderGetOptions,
  IShopifySyncOrderListOptions,
} from '../interfaces';

@Controller('shopify/api/orders')
export class OrdersController {
  constructor(
    protected readonly ordersService: OrdersService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  async listFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    /*
     * Options from shopify
     */
    @Query('created_at_max') created_at_max?: string,
    @Query('created_at_min') created_at_min?: string,
    @Query('fields') fields?: string,
    @Query('financial_status') financial_status?: string,
    @Query('fulfillment_status') fulfillment_status?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('processed_at_max') processed_at_max?: string,
    @Query('processed_at_min') processed_at_min?: string,
    @Query('since_id') since_id?: number,
    @Query('status') status: string = 'any',
    @Query('updated_at_max') updated_at_max?: string,
    @Query('updated_at_min') updated_at_min?: string,
    /**
     * Custom sync options
     */
    @Query('sync_to_db') syncToDb?: boolean,
    @Query('cancel_signal') cancelSignal?: string,
    @Query('fail_on_sync_error') failOnSyncError?: boolean,
  ) {
    try {
      const options: IShopifySyncOrderListOptions = {
        cancelSignal,
        created_at_max,
        created_at_min,
        failOnSyncError,
        fields,
        financial_status,
        fulfillment_status,
        limit,
        page,
        processed_at_max,
        processed_at_min,
        since_id,
        status,
        syncToDb,
        updated_at_max,
        updated_at_min,
      };
      return res.jsonp(await this.ordersService.listFromShopify(req.session[`shopify-connect-${req.shop}`], options));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('db')
  async listFromDb(
    @Req() req: IUserRequest,
    @Res() res: Response,
    /*
     * Options from shopify
     */
    @Query() options: IAppOrderListOptions,
  ) {
    try {
      return res.jsonp(await this.ordersService.listFromDb(req.session[`shopify-connect-${req.shop}`], options, {}));
    } catch (error) {
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
  listAllFromShopify(@Req() req: IUserRequest, @Res() res: Response, @Query() options: IShopifySyncOrderListOptions) {
    this.ordersService.listAllFromShopifyStream(req.session[`shopify-connect-${req.shop}`], {...options, status: 'any'}).pipe(res);
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('db/count')
  async countFromDb(@Req() req: IUserRequest, @Res() res: Response,  @Query() options: IShopifySyncOrderCountOptions) {
    try {
      return res.jsonp(await this.ordersService.countFromDb(req.session[`shopify-connect-${req.shop}`], options));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('db/diff')
  async diffSynced(@Req() req: IUserRequest, @Res() res: Response) {
    try {
      return res.jsonp(await this.ordersService.diffSynced(req.session[`shopify-connect-${req.shop}`]));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('count')
  async countFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query() options: IShopifySyncOrderCountOptions,
  ) {
    try {
      return res.jsonp(await this.ordersService.countFromShopify(req.session[`shopify-connect-${req.shop}`], options));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':id/db')
  async getFromDb(@Req() req: IUserRequest, @Res() res: Response, @Param('id') id: number) {
    try {
      return res.jsonp(await this.ordersService.getFromDb(req.session[`shopify-connect-${req.shop}`], id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('sync-progress/all')
  async listSyncProgress(@Req() req: IUserRequest, @Res() res: Response) {
    try {
      return res.jsonp(await this.ordersService.listSyncProgress(req.session[`shopify-connect-${req.shop}`]));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('sync-progress')
  async getLastSyncProgress(@Req() req: IUserRequest, @Res() res: Response) {
    try {
      return res.jsonp(await this.ordersService.getLastSyncProgress(req.session[`shopify-connect-${req.shop}`]));
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
  async getFromShopify(@Req() req: IUserRequest, @Res() res: Response, @Param('id') id: number) {
    try {
      return res.jsonp(await this.ordersService.getFromShopify(req.session[`shopify-connect-${req.shop}`], id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
