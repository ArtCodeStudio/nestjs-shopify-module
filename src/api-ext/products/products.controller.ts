import {
  Controller,
  UseGuards,
  UseInterceptors,
  CacheTTL,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { Roles } from '../../guards/roles.decorator';
import { ExtProductsService } from './products.service';
import { DebugService } from '../../debug.service';
import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { IUserRequest } from '../../interfaces/user-request';
import { RolesGuard } from '../../guards/roles.guard';
import { SortKey } from './products.service';
import { ApiCacheInterceptor } from '../../api/api-cache.interceptor';

@Controller('shopify/api-ext/products')
@UseInterceptors(ApiCacheInterceptor)
export class ExtProductsController {
  constructor(protected readonly extProductsService: ExtProductsService) {}

  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Get a list of all publications
   * @param req
   * @param res
   * @param themeId
   */
  @UseGuards(ShopifyApiGuard, RolesGuard)
  @Roles() // Also allowed from shop frontend
  @CacheTTL(300)
  @Get('scheduled')
  async listScheduled(
    @Req() req: IUserRequest,
    @Query('tag') tag = '*',
    @Query('limit') limit = 50,
    @Query('after') after,
    @Query('sortKey') sortKey = 'ID',
    @Query('reverse') reverse = false,
  ) {
    try {
      const products = await this.extProductsService.listScheduled(
        req.session[`shopify-connect-${req.shop}`],
        {
          limit: limit,
          tag: tag,
          sortKey: SortKey[sortKey as keyof typeof SortKey],
          reverse: reverse,
          after: after,
        },
      );
      return products;
    } catch (error) {
      return error;
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
  @CacheTTL(1800)
  async getPreview(@Req() req: IUserRequest, @Query('id') id) {
    const products = await this.extProductsService.getPreview(
      req.session[`shopify-connect-${req.shop}`],
      {
        id,
      },
    );
    return products;
  }
}
