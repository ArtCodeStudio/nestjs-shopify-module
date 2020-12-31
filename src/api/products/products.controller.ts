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
  HttpException,
  Header,
  Body,
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { DebugService } from '../../debug.service';

import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';
import { IUserRequest } from '../../interfaces';
import {
  IShopifySyncProductCountOptions,
  IShopifySyncProductGetOptions,
  IShopifySyncProductListOptions,
  IAppProductListOptions,
} from '../interfaces';
import { Response } from 'express';
import { Interfaces } from 'shopify-admin-api';

@Controller('shopify/api/products')
export class ProductsController {
  constructor(
    protected readonly productsService: ProductsService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Retrieves a list of products directly from shopify.
   * @param req
   * @param options
   *
   * @see https://help.shopify.com/en/api/reference/products/product#index
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get()
  async listFromShopify(
    @Req() req: IUserRequest,
    /*
     * Retransmitt options from shopify
     */
    @Query('collection_id') collection_id?: string,
    @Query('created_at_max') created_at_max?: string,
    @Query('created_at_min') created_at_min?: string,
    @Query('ids') ids?: string,
    @Query('page') page?: number,
    @Query('fields') fields?: string,
    @Query('limit') limit?: number,
    @Query('product_type') product_type?: string,
    @Query('published_at_max') published_at_max?: string,
    @Query('published_at_min') published_at_min?: string | undefined,
    @Query('published_status') published_status?: 'published' | 'unpublished' | 'any',
    @Query('since_id') since_id?: number,
    @Query('title') title?: string,
    @Query('updated_at_max') updated_at_max?: string,
    @Query('updated_at_min') updated_at_min?: string,
    @Query('vendor') vendor?: string,
    /*
     * Custom sync options
     */
    @Query('sync_to_db') syncToDb?: boolean,
    @Query('cancel_signal') cancelSignal?: string,
    @Query('fail_on_sync_error') failOnSyncError?: boolean,
  ) {
    if (req.session.isThemeClientRequest) {
      published_status = 'published'; // For security reasons, only return public products if the request comes not from a logged in user
      syncToDb = false;
    }
    const options: IShopifySyncProductListOptions = {
      /*
       * Retransmitt options from shopify
       */
      collection_id,
      created_at_max,
      created_at_min,
      ids,
      page,
      fields,
      limit,
      product_type,
      published_at_max,
      published_at_min,
      published_status,
      since_id,
      title,
      updated_at_max,
      updated_at_min,
      vendor,
      /*
       * Custom sync options
       */
      syncToDb,
      cancelSignal,
      failOnSyncError,
    };

    // replace " and ' if query string was parsed like this: '"1234, 3456, 7890"'
    // ids = ids.replace(/("|')/g, '');
    // fields = fields.replace(/("|')/g, '');

    this.logger.debug('[listFromShopify] ShopifySyncProductListOptions: %O', options);
    return this.productsService.listFromShopify(req.session[`shopify-connect-${req.shop}`], options)
    .then((products) => {
      this.logger.debug('[listFromShopify] products.length: %d', products.length);
      return products;
    })
    .catch((error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  /**
   * Retrieves a list of products from mongodb.
   * @param req
   * @param options
   *
   * @see https://help.shopify.com/en/api/reference/products/product#index
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('db')
  async listFromDb(
    @Req() req: IUserRequest,
    /*
     * Copied options from shopify
     */
    @Query('collection_id') collection_id?: string,
    @Query('created_at_max') created_at_max?: string,
    @Query('created_at_min') created_at_min?: string,
    @Query('ids') ids?: string,
    @Query('page') page?: number,
    @Query('fields') fields?: string,
    @Query('limit') limit?: number,
    @Query('product_type') product_type?: string,
    @Query('published_at_max') published_at_max?: string,
    @Query('published_at_min') published_at_min?: string,
    @Query('published_status') published_status: 'published' | 'unpublished' | 'any' = 'any',
    @Query('since_id') since_id?: number,
    @Query('title') title?: string,
    @Query('updated_at_max') updated_at_max?: string,
    @Query('updated_at_min') updated_at_min?: string,
    @Query('vendor') vendor?: string,
    /*
     * Custom app options
     */
    @Query('price_max') price_max?: number,
    @Query('price_min') price_min?: number,
    @Query('sort_by') sort_by?: string,
    @Query('sort_dir') sort_dir?: 'asc' | 'desc',
    // @Query('ids') ids?: string,
  ) {
    try {
      if (req.session.isThemeClientRequest) {
        published_status = 'published'; // For security reasons, only return public products if the request comes not from a logged in user
      }
      const options: IAppProductListOptions = {
        /*
         * Copied options from shopify
         */
        collection_id,
        created_at_max,
        created_at_min,
        ids,
        page,
        fields,
        limit,
        product_type,
        published_at_max,
        published_at_min,
        published_status,
        since_id,
        title,
        updated_at_max,
        updated_at_min,
        vendor,
        /*
         * Custom app options
         */
        price_max,
        price_min,
        sort_by,
        sort_dir,
      };
      return await this.productsService.listFromDb(req.session[`shopify-connect-${req.shop}`], options);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves all products as a stream directly from shopify.
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
  listAllFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    /*
     * Retransmitt options from shopify
     */
    @Query('collection_id') collection_id?: string,
    @Query('created_at_max') created_at_max?: string,
    @Query('created_at_min') created_at_min?: string,
    @Query('ids') ids?: string,
    @Query('page') page?: number,
    @Query('fields') fields?: string,
    @Query('limit') limit?: number,
    @Query('product_type') product_type?: string,
    @Query('published_at_max') published_at_max?: string,
    @Query('published_at_min') published_at_min?: string,
    @Query('published_status') published_status?: 'published' | 'unpublished' | 'any',
    @Query('since_id') since_id?: number,
    @Query('sync_to_db') sync_to_db?: boolean,
    @Query('title') title?: string,
    @Query('updated_at_max') updated_at_max?: string,
    @Query('updated_at_min') updated_at_min?: string,
    @Query('vendor') vendor?: string,
  ) {
    this.productsService.listAllFromShopifyStream(req.session[`shopify-connect-${req.shop}`], {
      collection_id,
      created_at_max,
      created_at_min,
      ids,
      page,
      fields,
      limit,
      product_type,
      published_at_max,
      published_at_min,
      published_status,
      since_id,
      syncToDb: sync_to_db,
      title,
      updated_at_max,
      updated_at_min,
      vendor,
    })
    .pipe(res)
    .on('error', (error) => {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  /**
   * Retrieves a count of products from mongodb.
   * @param req
   * @param options
   *
   * @see https://help.shopify.com/en/api/reference/products/product#count
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Empty == Allowed from shop frontend and backend
  @Get('db/count')
  async countFromDb(
    @Req() req: IUserRequest,
    @Query('collection_id') collection_id: string | undefined,
    @Query('created_at_max') created_at_max: string | undefined,
    @Query('created_at_min') created_at_min: string | undefined,
    @Query('product_type') product_type: string | undefined,
    @Query('published_at_max') published_at_max: string | undefined,
    @Query('published_at_min') published_at_min: string | undefined,
    @Query('published_status') published_status: 'published' | 'unpublished' | 'any' | undefined,
    @Query('updated_at_max') updated_at_max: string | undefined,
    @Query('updated_at_min') updated_at_min: string | undefined,
    @Query('vendor') vendor: string | undefined,
  ) {
    try {
      if (req.session.isThemeClientRequest) {
        published_status = 'published'; // For security reasons, only return public products if the request comes not from a logged in user
      }
      return await this.productsService.countFromDb(req.session[`shopify-connect-${req.shop}`], {
        collection_id,
        created_at_max,
        created_at_min,
        product_type,
        published_at_max,
        published_at_min,
        published_status,
        updated_at_max,
        updated_at_min,
        vendor,
      });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves a count of products directly from shopify.
   * @param req
   * @param options
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get('count')
  async countFromShopify(
    @Req() req: IUserRequest,
    @Query('collection_id') collection_id: string,
    @Query('created_at_max') created_at_max: string,
    @Query('created_at_min') created_at_min: string,
    @Query('product_type') product_type: string,
    @Query('published_status') published_status: 'published' | 'unpublished' | 'any',
    @Query('published_at_max') published_at_max: string,
    @Query('published_at_min') published_at_min: string,
    @Query('updated_at_max') updated_at_max: string,
    @Query('updated_at_min') updated_at_min: string,
    @Query('vendor') vendor: string,
  ) {
    const options: IShopifySyncProductCountOptions = {
      collection_id,
      created_at_max,
      created_at_min,
      product_type,
      published_at_max,
      published_at_min,
      published_status,
      updated_at_max,
      updated_at_min,
      vendor,
    };
    try {
      if (req.session.isThemeClientRequest) {
        published_status = 'published'; // For security reasons, only return public products if the request comes not from a logged in user
      }
      return await this.productsService.countFromShopify(req.session[`shopify-connect-${req.shop}`], options);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Helper route to check the sync
   * @param req
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('db/diff')
  async diffSynced(
    @Req() req: IUserRequest,
  ) {
    try {
      return await this.productsService.diffSynced(req.session[`shopify-connect-${req.shop}`]);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Updates a product and its variants and images directly from shopify.
   * @param req
   * @param id
   * @param product
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Put(':product_id')
  async updateInShopify(
    @Req() req: IUserRequest,
    @Param('product_id') id: number,
    @Body() product: Interfaces.ProductUpdateCreate,
  ) {
    this.logger.debug('update product id: %d, product: %O', id, product);
    try {
      return await this.productsService.updateInShopify(req.session[`shopify-connect-${req.shop}`], id, product);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Creates a new product directly from shopify.
   * @param req
   * @param id
   * @param product
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Post()
  async createInShopify(
    @Req() req: IUserRequest,
    @Body() product: Interfaces.ProductUpdateCreate,
  ) {
    this.logger.debug('create product: %O', product);
    try {
      return this.productsService.createInShopify(req.session[`shopify-connect-${req.shop}`], product)
      .catch((error) => {
        throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
      });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get sync progress
   * @param req
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('sync-progress/all')
  async listSyncProgress(@Req() req: IUserRequest) {
    try {
      return await this.productsService.listSyncProgress(req.session[`shopify-connect-${req.shop}`]);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get sync progress
   * @param req
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Get('sync-progress')
  async getLastSyncProgress(@Req() req: IUserRequest) {
    try {
      return await this.productsService.getLastSyncProgress(req.session[`shopify-connect-${req.shop}`]);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Deletes a product with the given id directly in shopify.
   * @param req
   * @param id Id of the product being deleted.
   */
  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member')
  @Delete(':product_id')
  async deleteInShopify(
    @Req() req: IUserRequest,
    @Param('product_id') id: number,
  ) {
    try {
      return await this.productsService.deleteInShopify(req.session[`shopify-connect-${req.shop}`], id);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves a single product from mongodb.
   * @param req
   * @param id Product id
   *
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get(':id/db')
  async getFromDb(@Req() req: IUserRequest, @Param('id') id: number) {
    try {
      return await this.productsService.getFromDb(req.session[`shopify-connect-${req.shop}`], id);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves a single product directly from shopify.
   * @param req
   * @param id Product id
   *
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get(':id')
  async getFromShopify(
    @Req() req: IUserRequest,
    @Param('id') id: number,
    @Query('fields') fields?: string,
  ) {
    const options: IShopifySyncProductGetOptions = {
      fields,
    };
    try {
      return await this.productsService.getFromShopify(req.session[`shopify-connect-${req.shop}`], id, options);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.generic ? error.generic : error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
