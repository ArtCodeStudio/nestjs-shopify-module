import {
  Controller,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  Get,
  Delete,
  Post,
  HttpStatus,
  Options,
} from '@nestjs/common';

import { Response } from 'express';

import { IUserRequest } from '../interfaces/user-request';

import { SyncService } from './sync.service';

import { ISyncOptions } from '../interfaces';

import { ShopifyApiGuard } from '../guards/shopify-api.guard';
import { Roles } from '../guards/roles.decorator';
import { DebugService } from '../debug.service';

@Controller('shopify/sync')
export class SyncController {
  constructor(
    protected readonly syncService: SyncService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);


  /**
   * Get last sync progress
   * @param req 
   * @param res 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  async lastFromShop(
    @Req() req: IUserRequest,
    @Res() res: Response,
  ) {
    return this.syncService.findOne(
      { shop: req.shopifyConnect.shop.myshopify_domain },
      { sort: { 'createdAt': -1} },
    )
    .then((progress) => {
      res.jsonp(progress);
    })
    .catch((error) => {
      this.logger.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }

  /**
   * List sync progresses
   * @param req 
   * @param res 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('list')
  async allFromShop(
    @Req() req: IUserRequest,
    @Res() res: Response,
  ) {
    return this.syncService.find(
      { shop: req.shopifyConnect.shop.myshopify_domain },
      { sort: { 'createdAt': -1} },
    )
    .then((progress) => {
      res.jsonp(progress);
    })
    .catch((error) => {
      this.logger.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }

  /**
   * Start sync progress
   * @param req 
   * @param res 
   * @param includeOrders 
   * @param includeTransactions 
   * @param includeProducts 
   * @param includePages 
   * @param resync 
   * @param cancelExisting 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Post()
  async start(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('includeOrders') includeOrders?: boolean,
    @Param('includeTransactions') includeTransactions?: boolean,
    @Param('includeProducts') includeProducts?: boolean,
    @Param('includePages') includePages?: boolean,
    @Param('includeSmartCollection') includeSmartCollection?: boolean,
    @Param('includeCustomCollection') includeCustomCollection?: boolean,
    @Param('resync') resync?: boolean,
    @Param('cancelExisting') cancelExisting?: boolean,
  ) {
    let options: ISyncOptions = {
      includeOrders: !!includeOrders,
      includeTransactions: !!includeTransactions,
      includeProducts: !!includeProducts,
      includePages: !!includePages,
      includeSmartCollection: !!includeSmartCollection,
      includeCustomCollection: !!includeCustomCollection,
      resync: !!resync,
      cancelExisting: !!cancelExisting,
    }
    this.logger.debug(`startSync(${JSON.stringify(options, null, 2)}`);
    return this.syncService.startSync(req.shopifyConnect, options)
    .then((progress) => {
      res.jsonp(progress);
    })
    .catch((error) => {
      this.logger.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }

  /**
   * @deprecated Use @Post() instead
   * @param req 
   * @param res 
   * @param includeOrders 
   * @param includeTransactions 
   * @param includeProducts 
   * @param resync 
   * @param cancelExisting 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('start')
  async startSync(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query('include_orders') includeOrders?: boolean,
    @Query('include_transactions') includeTransactions?: boolean,
    @Query('include_products') includeProducts?: boolean,
    @Param('include_pages') includePages?: boolean,
    @Param('include_smart_collection') includeSmartCollection?: boolean,
    @Param('include_custom_collection') includeCustomCollection?: boolean,
    @Query('resync') resync?: boolean,
    @Query('cancelExisting') cancelExisting?: boolean,
  ) {
    return this.start(req, res, includeOrders, includeTransactions, includeProducts, includePages, includeSmartCollection, includeCustomCollection, resync, cancelExisting);
  }

  /**
   * Cancel sync progress
   * @param req 
   * @param res 
   * @param id 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Delete()
  async cancel(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query('id') id: string,
  ) {
    return this.syncService.cancelShopSync(req.shopifyConnect, id)
    .then((result) => {
      res.jsonp(result);
    })
    .catch((error) => {
      this.logger.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }

  /**
   * @deprecated Use @Delete() instead
   * @param req 
   * @param res 
   * @param id 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('cancel')
  async cancelSync(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query('id') id: string,
  ) {
    return this.cancel(req, res, id);
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('admin')
  @Get('findOne')
  async findOne(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query() query,
  ) {
    return this.syncService.findOne(query)
    .then((progress) => {
      res.jsonp(progress);
    })
    .catch((error) => {
      this.logger.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('admin')
  @Get('find')
  async find(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query() query,
  ) {
    return this.syncService.find(query)
    .then((progress) => {
      res.jsonp(progress);
    })
    .catch((error) => {
      this.logger.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    });
  }

}
