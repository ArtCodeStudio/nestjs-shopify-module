import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus, Header } from '@nestjs/common';
import { Response } from 'express';
import { IUserRequest } from '../../interfaces/user-request';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';
import { Readable } from 'stream';
import { DebugService } from '../../debug.service';
import { SmartCollectionListOptions, SmartCollectionGetOptions, SmartCollectionCountOptions } from '../interfaces'

import { SmartCollectionsService } from './smart-collections.service';

@Controller('shopify/api/smart-collections')
export class SmartCollectionsController {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    protected readonly smartCollectionsService: SmartCollectionsService
  ) {};

  /**
   * Retrieves a list of smart collections directly from shopify.
   * @param req 
   * @param res 
   * @param options 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Empty == Allowed from shop frontend and backend
  @Get()
  async list(
    @Req() req: IUserRequest,
    @Res() res: Response,
    /**
     * The number of results to show.
     */
    @Query('limit') limit: number = 50,
    /**
     * The page of results to show.
     */
    @Query('page') page: number = 1,
    /**
     * Show only the results specified in this comma-separated list of IDs.
     */
    @Query('ids') ids?: string,
    /**
     * Restrict results to after the specified ID.
     */
    @Query('since_id') since_id?: number,
    /**
     * Show smart collections with the specified title.
     */
    @Query('title') title?: string,
    /**
     * Show smart collections that includes the specified product.
     */
    @Query('product_id') product_id?: number,
    /**
     * Filter results by smart collection handle.
     */
    @Query('handle') handle?: string,
    /**
     * Show smart collections last updated after this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query('updated_at_min') updated_at_min?: string,
    /**
     * Show smart collections last updated before this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query('updated_at_max') updated_at_max?: string,
    /**
     * Show smart collections published after this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query('published_at_min') published_at_min?: string,
    /**
     * Show smart collections published before this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query('published_at_max') published_at_max?: string,
    /**
     * Filter results based on the published status of smart collections.
     */
    @Query('published_status') published_status: 'published' | 'unpublished' | 'any' = 'any',
    /**
     * Show only certain fields, specified by a comma-separated list of field names.
     */
    @Query('fields') fields?: string,
  ) {
    if (req.session.isThemeClientRequest) {
      published_status = 'published'; // For security reasons, only return public smart collections if the request comes not from a logged in user
    }

    const options: SmartCollectionListOptions = {
      limit,
      page,
      ids,
      since_id,
      title,
      product_id,
      handle,
      updated_at_min,
      updated_at_max,
      published_at_min,
      published_at_max,
      published_status,
      fields,
    }

    try {
      return res.jsonp(await this.smartCollectionsService.listFromShopify(req.shopifyConnect, options));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  /**
   * Retrieves a list of smart collections from app database.
   * @param req 
   * @param res 
   * @param options 
   */
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

  /**
   * Retrieves a list with full data as `ReadableStream` of smart collections directly from shopify.
   * @param req 
   * @param res 
   * @param options 
   */
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

  /**
   * Retrieves a count of smart collections directly from shopify.
   * @param req 
   * @param res 
   * @param options 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Empty == Allowed from shop frontend and backend
  @Get('count')
  async countFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    /**
     * Show smart collections with the specified title.
     */
    @Query('title') title?: string,
    /**
     * Show smart collections that include the specified product.
     */
    @Query('product_id') product_id?: number,
    /**
     * Show smart collections last updated after this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query('updated_at_min') updated_at_min?: string,
    /**
     * Show smart collections last updated before this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query('updated_at_max') updated_at_max?: string,
    /**
     * Show smart collections published after this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query('published_at_min') published_at_min?: string,
    /**
     * Show smart collections published before this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query('published_at_max') published_at_max?: string,
    /**
     * Filter results based on the published status of smart collections.
     */
    @Query('published_status') published_status: 'published' | 'unpublished' | 'any' = 'any',
  ) {
    const options: SmartCollectionCountOptions = {
      title,
      product_id,
      updated_at_min,
      updated_at_max,
      published_at_min,
      published_at_max,
      published_status,
    }
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

  /**
   * Retrieves a single smart collection by it's id directly from shopify.
   * @param req 
   * @param res 
   * @param id 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Empty == Allowed from shop frontend and backend
  @Get(':id')
  async getFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('id') id: number,
    @Query('fields') fields: string,
  ) {
    const options: SmartCollectionGetOptions = {
      fields,
    }
    try {
      return res.jsonp(await this.smartCollectionsService.getFromShopify(req.shopifyConnect, id, options));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
