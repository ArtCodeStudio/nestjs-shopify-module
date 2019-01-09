import {
  Controller,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  Get,
  HttpStatus,
} from '@nestjs/common';

import { Response } from 'express';

import { IUserRequest } from '../interfaces/user-request';

import { SyncService } from './sync.service';

import { ISyncOptions } from './sync-progress.schema';

import { ShopifyApiGuard } from '../guards/shopify-api.guard';
import { Roles } from '../guards/roles.decorator';
import { DebugService } from '../debug.service';

@Controller('shopify/sync')
export class SyncController {
  constructor(
    protected readonly syncService: SyncService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('start')
  async startSync(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query('include_orders') includeOrders?: boolean,
    @Query('include_transactions') includeTransactions?: boolean,
    @Query('include_products') includeProducts?: boolean,
    @Query('resync') resync?: boolean,
    @Query('cancelExisting') cancelExisting?: boolean,
  ) {
    const options: ISyncOptions = {
      includeOrders: !!includeOrders,
      includeTransactions: !!includeTransactions,
      includeProducts: !!includeProducts,
      resync: !!resync,
      cancelExisting: !!cancelExisting,
    }
    try {
      return res.jsonp(await this.syncService.startSync(req.shopifyConnect, options));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('cancel')
  async cancelSync(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query('id') id: string,
  ) {
    try {
      return res.jsonp(await this.syncService.cancelShopSync(req.shopifyConnect, id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('admin')
  @Get('findOne')
  async findOne(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query() query,
  ) {
    try {
      return res.jsonp(await this.syncService.findOne(query));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('admin')
  @Get('find')
  async find(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query() query,
  ) {
    try {
      return res.jsonp(await this.syncService.find(query));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('progress')
  async lastFromShop(
    @Req() req: IUserRequest,
    @Res() res: Response,
  ) {
    try {
      return res.jsonp(
        await this.syncService.findOne(
          { shop: req.shopifyConnect.shop.myshopify_domain },
          { sort: { 'createdAt': -1} },
        )
      );
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('progress/all')
  async allFromShop(
    @Req() req: IUserRequest,
    @Res() res: Response,
  ) {
    try {
      return res.jsonp(
        await this.syncService.find(
          { shop: req.shopifyConnect.shop.myshopify_domain },
          { sort: { 'createdAt': -1} },
        )
      );
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
