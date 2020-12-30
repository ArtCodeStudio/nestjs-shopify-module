import { Controller, UseGuards, Inject, Req, Res, Get, HttpStatus, Query } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../guards/roles.decorator';
import { ExtProductsService } from './products.service';
import { DebugService } from '../../debug.service';
import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { IUserRequest } from '../../interfaces/user-request';
import { RolesGuard } from '../../guards/roles.guard';
import { SortKey } from './products.service';

// import { ApiCacheInterceptor } from '../../api/api-cache.interceptor';
import { SHOPIFY_MODULE_OPTIONS } from '../../shopify.constants';
import { ShopifyModuleOptions } from '../../interfaces/shopify-module-options';

// TODO: As long as we use JSONP and not CORS, we can't use interceptors and need this workaround:
import * as cacheManager from 'cache-manager';
import { Cache } from '../../api/interfaces/api-cache';

@Controller('shopify/api-ext/products')
//@UseInterceptors(ApiCacheInterceptor)
export class ExtProductsController {
  constructor(
    protected readonly extProductsService: ExtProductsService,
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
    if (!this.shopifyModuleOptions.cache && this.shopifyModuleOptions.cache.store) {
      throw new Error('You need a cache');
    }
    this.cache = cacheManager.caching(this.shopifyModuleOptions.cache) as Cache;
  }

  cache: Cache;
  
  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Get a list of all publications
   * @param req
   * @param res
   * @param themeId
   */
  @UseGuards(ShopifyApiGuard, RolesGuard)
  @Roles() // Also allowed from shop frontend
  // @CacheTTL(300)
  @Get('scheduled')
  async listScheduled(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query("tag") tag = "*",
    @Query("limit") limit = 50,
    @Query("after") after,
    @Query("sortKey") sortKey = "ID",
    @Query("reverse") reverse = false,
    @Query() query = { tag: "*", limit: 50, sortKey: "ID", reverse: false }
  ) {
    console.log( SortKey[sortKey as keyof typeof SortKey])
    const myshopifyDomain = req.session[`shopify-connect-${req.shop}`].shop.myshopify_domain;
    const route = `shopify/api-ext/products/?` + Object.keys(query).map(k => `${k}=${query[k]}`).join('&');
    const key = JSON.stringify({
      route,
      myshopifyDomain
    });
    try {
      return res.jsonp(
        await this.cache.wrap<any>(
          key,
          () => this.extProductsService.listScheduled(
            req.session[`shopify-connect-${req.shop}`],
            {
              limit,
              tag,
              sortKey: SortKey[sortKey as keyof typeof SortKey],
              reverse,
              after
            }
          ),
          { ttl: 300 }
        )
      );
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }

    /**
   * Get a list of all publications
   * @param req
   * @param res
   * @param themeId
   */
  @UseGuards(ShopifyApiGuard, RolesGuard)
  @Roles() // Also allowed from shop frontend
  @Get('preview')
  // @CacheTTL(1800)
  async getPreview(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query("id") id,
  ) {
    const myshopifyDomain = req.session[`shopify-connect-${req.shop}`].shop.myshopify_domain;
    const route = `shopify/api-ext/products/?id=${id}`;
    const key = JSON.stringify({
      route,
      myshopifyDomain
    });
    try {
      return res.jsonp(await this.cache.wrap<any>(
        key,
        () => this.extProductsService.getPreview(req.session[`shopify-connect-${req.shop}`], {id}),
        { ttl: 1800 }
      ));
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
        message: error.message,
      });
    }
  }
}
