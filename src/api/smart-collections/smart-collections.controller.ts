import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus, Header } from '@nestjs/common';
import { Response } from 'express';
import { IUserRequest } from '../../interfaces/user-request';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';
import { Readable } from 'stream';
import { DebugService } from '../../debug.service';
import {
  IShopifySyncSmartCollectionListOptions,
  IShopifySyncSmartCollectionGetOptions,
  IShopifySyncSmartCollectionCountOptions,
  IAppSmartCollectionListOptions,
  IAppSmartCollectionGetOptions,
  IAppSmartCollectionCountOptions,
} from '../interfaces';

import { SmartCollectionsService } from './smart-collections.service';

@Controller('shopify/api/smart-collections')
export class SmartCollectionsController {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    protected readonly smartCollectionsService: SmartCollectionsService,
  ) {}

  /**
   * Retrieves a list of smart collections directly from shopify.
   * @param req
   * @param res
   * @param options
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Empty == Allowed from shop frontend and backend
  @Get()
  async listFromShopify(
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

    const options: IShopifySyncSmartCollectionListOptions = {
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
    };

    try {
      return res.jsonp(await this.smartCollectionsService.listFromShopify(req.session[`shopify-connect-${req.shop}`], options));
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
  @Get('db')
  async listFromDb(
    @Req() req: IUserRequest,
    @Res() res: Response,
    /*
     * Options from shopify
     */
    @Query('fields') fields?: string,
    @Query('handle') handle?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('product_id') product_id?: number,
    @Query('published_at_max') published_at_max?: string,
    @Query('published_at_min') published_at_min?: string,
    @Query('published_status') published_status?: 'published' | 'unpublished' | 'any',
    @Query('since_id') since_id?: number,
    @Query('title') title?: string,
    @Query('updated_at_max') updated_at_max?: string,
    @Query('updated_at_min') updated_at_min?: string,
    @Query('vendor') vendor?: string,
    /*
     * Custom app options
     */
    @Query('ids') ids?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_dir') sort_dir?: 'asc' | 'desc',
  ) {
    try {
      const options: IAppSmartCollectionListOptions = {
        /*
         * Options from shopify
         */
        fields,
        handle,
        limit,
        page,
        product_id,
        updated_at_max,
        updated_at_min,
        published_at_max,
        published_at_min,
        published_status,
        since_id,
        title,
        /*
         * Custom app options
         */
        sort_by,
        sort_dir,
        ids,
      };
      return res.jsonp(await this.smartCollectionsService.listFromDb(req.session[`shopify-connect-${req.shop}`], options, {}));
    } catch (error) {
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
  listAllFromShopify(@Req() req: IUserRequest, @Res() res: Response, @Query() options: IShopifySyncSmartCollectionListOptions) {
    this.smartCollectionsService.listAllFromShopifyStream(req.session[`shopify-connect-${req.shop}`], options).pipe(res);
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('db/count')
  async countFromDb(@Req() req: IUserRequest, @Res() res: Response,  @Query() options: IShopifySyncSmartCollectionCountOptions) {
    try {
      return res.jsonp(await this.smartCollectionsService.countFromDb(req.session[`shopify-connect-${req.shop}`], options));
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
      return res.jsonp(await this.smartCollectionsService.diffSynced(req.session[`shopify-connect-${req.shop}`]));
    } catch (error) {
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
    const options: IShopifySyncSmartCollectionCountOptions = {
      title,
      product_id,
      updated_at_min,
      updated_at_max,
      published_at_min,
      published_at_max,
      published_status,
    };
    try {
      return res.jsonp(await this.smartCollectionsService.countFromShopify(req.session[`shopify-connect-${req.shop}`], options));
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
      return res.jsonp(await this.smartCollectionsService.getFromDb(req.session[`shopify-connect-${req.shop}`], id));
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
    const options: IShopifySyncSmartCollectionGetOptions = {
      fields,
    };
    try {
      return res.jsonp(await this.smartCollectionsService.getFromShopify(req.session[`shopify-connect-${req.shop}`], id, options));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
