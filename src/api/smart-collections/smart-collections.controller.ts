import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus, Header } from '@nestjs/common';
import { Response } from 'express';
import { IUserRequest } from '../../interfaces/user-request';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';
import { Readable } from 'stream';
import { DebugService } from '../../debug.service';

import { SmartCollectionsService, SmartCollectionListOptions, SmartCollectionGetOptions, SmartCollectionCountOptions } from './smart-collections.service';

@Controller('shopify/api/smart-collections')
export class SmartCollectionsController {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    protected readonly smartCollectionsService: SmartCollectionsService
  ) {};

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get()
  async list(@Req() req: IUserRequest, @Res() res: Response, @Query() options: SmartCollectionListOptions) {
    try {
      return res.jsonp(await this.smartCollectionsService.listFromShopify(req.shopifyConnect, options));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('synced')
  async listFromDb(@Req() req: IUserRequest, @Res() res: Response) {
    try {
      return res.jsonp(await this.smartCollectionsService.listFromDb(req.shopifyConnect));
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
  listAllFromShopify(@Req() req: IUserRequest, @Res() res: Response, @Query() options: SmartCollectionListOptions) {
    this.smartCollectionsService.listAllFromShopifyStream(req.shopifyConnect, options).pipe(res);
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('synced/count')
  async countFromDb(@Req() req: IUserRequest, @Res() res: Response,  @Query() options: SmartCollectionCountOptions) {
    try {
      return res.jsonp(await this.smartCollectionsService.countFromDb(req.shopifyConnect, options));
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
  async diffSynced(@Req() req: IUserRequest, @Res() res: Response) {
    try {
      return res.jsonp(await this.smartCollectionsService.diffSynced(req.shopifyConnect));
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
  async countFromShopify(@Req() req: IUserRequest, @Res() res: Response,  @Query() options: SmartCollectionCountOptions) {
    try {
      return res.jsonp(await this.smartCollectionsService.countFromShopify(req.shopifyConnect, options));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get(':id/synced')
  async getFromDb(@Req() req: IUserRequest, @Res() res: Response, @Param('id') id: number) {
    try {
      return res.jsonp(await this.smartCollectionsService.getFromDb(req.shopifyConnect, id));
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
      return res.jsonp(await this.smartCollectionsService.getFromShopify(req.shopifyConnect, id));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
