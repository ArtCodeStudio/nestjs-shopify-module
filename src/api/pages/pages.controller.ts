import {
  Controller,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  Get,
  Put,
  Post,
  Delete,
  HttpStatus,
  Header,
  Body,
} from '@nestjs/common';

import { PagesService } from './pages.service';
import { DebugService } from '../../debug.service';
import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';
import { Readable } from 'stream';

// Interfaces
import { Page } from 'shopify-prime/models';
import { IUserRequest } from '../../interfaces/user-request';
import { Response } from 'express';
import {
  IAppPageCountOptions,
  IAppPageGetOptions,
  IAppPageListOptions,
  IShopifySyncPageCountOptions,
  IShopifySyncPageGetOptions,
  IShopifySyncPageListOptions,
} from '../interfaces';

@Controller('shopify/api/pages')
export class PagesController {

  constructor(
    protected readonly pagesService: PagesService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Creates a new page in shopify.
   * @param req
   * @param res
   * @param id
   * @param page
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Post()
  async createInShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Body() page: Page,
  ) {
    this.logger.debug('create page', page);
    try {
      return this.pagesService.create(req.shopifyConnect, page)
      .then((result) => {
        this.logger.debug('result', result);
        return res.jsonp(result);
      });
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Retrieves a list of pages directly from shopify.
   * @param req
   * @param res
   * @param options
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get()
  async listFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query('created_at_max') created_at_max: string | undefined,
    @Query('created_at_min') created_at_min: string | undefined,
    @Query('page') page: number | undefined,
    @Query('fields') fields: string | undefined,
    @Query('handle') handle: string | undefined,
    @Query('limit') limit: number | undefined,
    @Query('published_at_max') published_at_max: string | undefined,
    @Query('published_at_min') published_at_min: string | undefined,
    @Query('published_status') published_status: 'published' | 'unpublished' | 'any' | undefined,
    @Query('since_id') since_id: number | undefined,
    @Query('sync_to_db') sync_to_db: boolean | undefined,
    @Query('sync_to_search') sync_to_search: boolean | undefined,
    @Query('title') title: string | undefined,
    @Query('updated_at_max') updated_at_max: string | undefined,
    @Query('updated_at_min') updated_at_min: string | undefined,
  ) {
    try {
      if (req.session.isThemeClientRequest) {
        published_status = 'published'; // For security reasons, only return public pages if the request comes not from a logged in user
        sync_to_db = false;
        sync_to_search = false;
      }
      const options: IShopifySyncPageListOptions = {
        created_at_max,
        created_at_min,
        fields,
        handle,
        limit,
        page,
        published_at_max,
        published_at_min,
        published_status,
        since_id,
        syncToDb: sync_to_db,
        syncToSearch: sync_to_search,
        title,
        updated_at_max,
        updated_at_min,
      };

      this.logger.debug('PageListOptions', options);
      return res.jsonp(await this.pagesService.list(req.shopifyConnect, options));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Retrieves a count of pages directly from shopify.
   * @param req
   * @param res
   * @param options
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get('count')
  async countFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query('created_at_max') created_at_max: string,
    @Query('created_at_min') created_at_min: string,
    @Query('published_status') published_status: 'published' | 'unpublished' | 'any',
    @Query('title') title: string,
    @Query('published_at_max') published_at_max: string,
    @Query('published_at_min') published_at_min: string,
    @Query('updated_at_max') updated_at_max: string,
    @Query('updated_at_min') updated_at_min: string,
  ) {
    try {
      if (req.session.isThemeClientRequest) {
        published_status = 'published'; // For security reasons, only return public pages if the request comes not from a logged in user
      }
      return res.jsonp(await this.pagesService.count(req.shopifyConnect, {
        created_at_max,
        created_at_min,
        published_at_max,
        published_at_min,
        published_status,
        title,
        updated_at_max,
        updated_at_min,
      }));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Retrieves a single page directly from shopify.
   * @param req
   * @param res
   * @param id page id
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get(':id')
  async getFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    try {
      return res.jsonp(await this.pagesService.get(req.shopifyConnect, id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Deletes a page with the given id directly in shopify.
   * @param req
   * @param res
   * @param id Id of the page being deleted.
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Delete(':page_id')
  async deleteInShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('page_id') id: number,
  ) {
    try {
      return res.jsonp(await this.pagesService.delete(req.shopifyConnect, id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Updates a page directly from shopify.
   * @param req
   * @param res
   * @param id Page id
   * @param page
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Put(':page_id')
  async updateInShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('page_id') id: number,
    @Body() page: Partial<Page>,
  ) {
    this.logger.debug('update page', id, page);
    try {
      return res.jsonp(await this.pagesService.update(req.shopifyConnect, id, page));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

}
