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

import { BlogsService } from './blogs.service';
import { DebugService } from '../../debug.service';
import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';
import { Readable } from 'stream';

// Interfaces
import { Interfaces } from 'shopify-admin-api';
import { IUserRequest } from '../../interfaces/user-request';
import { Response } from 'express';
import {
  IAppBlogCountOptions,
  IAppBlogGetOptions,
  IAppBlogListOptions,
  IShopifySyncBlogCountOptions,
  IShopifySyncBlogGetOptions,
  IShopifySyncBlogListOptions,
} from '../interfaces';

@Controller('shopify/api/blogs')
export class BlogsController {

  constructor(
    protected readonly blogsService: BlogsService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Creates a new blog in shopify.
   * @param req
   * @param res
   * @param id
   * @param blog
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Post()
  async createInShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Body() blog: Interfaces.Blog,
  ) {
    this.logger.debug('create blog %O', blog);
    try {
      return this.blogsService.create(req.session[`shopify-connect-${req.shop}`], blog)
      .then((result) => {
        this.logger.debug('result %O', result);
        return res.jsonp(result);
      });
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Retrieves a list of blogs directly from shopify.
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
    /*
     * Options from shopify
     */
    @Query('fields') fields?: string,
    @Query('handle') handle?: string,

    @Query('since_id') since_id?: number,
    /**
     * Custom sync options
     */
    @Query('sync_to_db') syncToDb?: boolean,
    @Query('cancel_signal') cancelSignal?: string,
    @Query('fail_on_sync_error') failOnSyncError?: boolean,
  ) {
    try {
      if (req.session.isThemeClientRequest) {
        // published_status = 'published'; // For security reasons, only return visible blogs if the request comes not from a logged in user
        syncToDb = false;
      }
      const options: IShopifySyncBlogListOptions = {
        fields,
        handle,
        since_id,
        syncToDb,
        cancelSignal,
        failOnSyncError,
      };

      this.logger.debug('BlogListOptions %O', options);
      return res.jsonp(await this.blogsService.list(req.session[`shopify-connect-${req.shop}`], options));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Retrieves a count of blogs directly from shopify.
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
  ) {
    try {
      return res.jsonp(await this.blogsService.count(req.session[`shopify-connect-${req.shop}`], {}));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Retrieves a single blog directly from shopify.
   * @param req
   * @param res
   * @param id blog id
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
      return res.jsonp(await this.blogsService.get(req.session[`shopify-connect-${req.shop}`], id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Deletes a blog with the given id directly in shopify.
   * @param req
   * @param res
   * @param id Id of the blog being deleted.
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Delete(':blog_id')
  async deleteInShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('blog_id') id: number,
  ) {
    try {
      return res.jsonp(await this.blogsService.delete(req.session[`shopify-connect-${req.shop}`], id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

  /**
   * Updates a blog directly from shopify.
   * @param req
   * @param res
   * @param id Blog id
   * @param blog
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Put(':blog_id')
  async updateInShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Param('blog_id') id: number,
    @Body() blog: Partial<Interfaces.Blog>,
  ) {
    this.logger.debug('update blog id: $d blog: %O', id, blog);
    try {
      return res.jsonp(await this.blogsService.update(req.session[`shopify-connect-${req.shop}`], id, blog));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp(error);
    }
  }

}
