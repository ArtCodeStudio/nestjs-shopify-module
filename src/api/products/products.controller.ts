import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus, Header } from '@nestjs/common';

import { ProductsService, ProductListOptions, ProductCountOptions } from './products.service';
import { DebugService } from '../../debug.service';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';
import { Readable } from 'stream';
import { IUserRequest } from '../../interfaces/user-request';
import { Response } from 'express';
import { IShopifyConnect } from '../../auth/interfaces/connect';


@Controller('shopify/api/products')
export class ProductsController {
  constructor(
    protected readonly productsService: ProductsService
  ) {};
  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Retrieves a list of products directly from shopify.
   * @param req 
   * @param res 
   * @param options 
   * 
   * @see https://help.shopify.com/en/api/reference/products/product#index
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get()
  async list(@Req() req: IUserRequest, @Res() res: Response, @Query() options: ProductListOptions) {
    try {
      return res.jsonp(await this.productsService.listFromShopify(req.shopifyConnect, {...options}));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        apiRateLimitReached: error.apiRateLimitReached,
        message: error.generic ? error.generic : error.message,
      });
    }
  }

  /**
   * Retrieves a list of products from the app database.
   * @param req 
   * @param res 
   * @param options 
   * 
   * @see https://help.shopify.com/en/api/reference/products/product#index
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('synced')
  async listFromDb(@Req() req: IUserRequest, @Res() res: Response) {
    try {
      return res.jsonp(await this.productsService.listFromDb(req.shopifyConnect));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.generic ? error.generic : error.message,
      });
    }
  }

  /**
   * Retrieves a all products as a stream directly from shopify.
   * @param req 
   * @param res 
   * @param options 
   * 
   * @see https://help.shopify.com/en/api/reference/products/product#count
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('all')
  @Header('Content-type', 'application/json')
  listAllFromShopify(@Req() req: IUserRequest, @Res() res: Response, @Query() options: ProductListOptions) {
    this.productsService.listAllFromShopifyStream(req.shopifyConnect, {...options}).pipe(res);
  }

  /**
   * Retrieves a count of products from the app database.
   * @param req 
   * @param res 
   * @param options 
   * 
   * @see https://help.shopify.com/en/api/reference/products/product#count
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get('synced/count')
  async countFromDb(@Req() req: IUserRequest, @Res() res: Response,  @Query() options: ProductCountOptions) {
    try {
      return res.jsonp(await this.productsService.countFromDb(req.shopifyConnect, options));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  /**
   * Retrieves a count of products directly from shopify.
   * @param req 
   * @param res 
   * @param options 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get('count')
  async countFromShopify(@Req() req: IUserRequest, @Res() res: Response,  @Query() options: ProductCountOptions) {
    try {
      return res.jsonp(await this.productsService.countFromShopify(req.shopifyConnect, options));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        apiRateLimitReached: error.apiRateLimitReached,
        message: error.generic ? error.generic : error.message,
      });
    }
  }

  /**
   * Retrieves a single product from the app database.
   * @param req 
   * @param res 
   * @param id Product id
   * 
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get(':id/synced')
  async getFromDb(@Req() req: IUserRequest, @Res() res: Response, @Param('id') id: number) {
    try {
      return res.jsonp(await this.productsService.getFromDb(req.shopifyConnect, id));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

  /**
   * Retrieves a single product directly from shopify.
   * @param req 
   * @param res 
   * @param id Product id
   * 
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get(':id')
  async getFromShopify(@Req() req: IUserRequest, @Res() res: Response, @Param('id') id: number) {
    try {
      return res.jsonp(await this.productsService.getFromShopify(req.shopifyConnect, id));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        apiRateLimitReached: error.apiRateLimitReached,
        message: error.generic ? error.generic : error.message,
      });
    }
  }

  /**
   * Helper route to check the sync
   * @param req 
   * @param res 
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('synced/diff')
  async diffSynced(@Req() req: IUserRequest, @Res() res: Response) {
    try {
      return res.jsonp(await this.productsService.diffSynced(req.shopifyConnect));
    } catch(error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
