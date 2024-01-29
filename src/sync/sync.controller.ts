import {
  Controller,
  Query,
  Body,
  UseGuards,
  Req,
  Get,
  Delete,
  Post,
  HttpStatus,
  HttpException,
} from "@nestjs/common";

import { IUserRequest } from "../interfaces/user-request";

import { SyncService } from "./sync.service";

import { IStartSyncOptions } from "../interfaces";

import { ShopifyApiGuard } from "../guards/shopify-api.guard";
import { Roles } from "../guards/roles.decorator";
import { DebugService } from "../debug.service";

@Controller("shopify/sync")
export class SyncController {
  constructor(protected readonly syncService: SyncService) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

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
  @Roles("shopify-staff-member")
  @Post()
  async start(
    @Req() req: IUserRequest,
    @Body() body: any,
    @Body("syncToDb") syncToDb?: boolean | string,
    @Body("includeOrders") includeOrders?: boolean | string,
    @Body("includeTransactions") includeTransactions?: boolean | string,
    @Body("includeProducts") includeProducts?: boolean | string,
    @Body("includePages") includePages?: boolean | string,
    @Body("includeSmartCollections") includeSmartCollections?: boolean | string,
    @Body("includeCustomCollections")
    includeCustomCollections?: boolean | string,
    @Body("resync") resync?: boolean | string,
    @Body("cancelExisting") cancelExisting?: boolean | string
  ) {
    this.logger.debug(
      "syncToDb: %O; includeOrders: %O; includeTransactions: %O; includeProducts: %O; includePages: %O; includeSmartCollections: %O; includeCustomCollections: %O; resync: %O; cancelExisting: %O;",
      {
        syncToDb,
        includeOrders,
        includeTransactions,
        includeProducts,
        includePages,
        includeSmartCollections,
        includeCustomCollections,
        resync,
        cancelExisting,
      }
    );
    const options: IStartSyncOptions = {
      syncToDb: syncToDb === "true" || syncToDb === true,
      includeOrders: includeOrders === "true" || includeOrders === true,
      includeTransactions:
        includeTransactions === "true" || includeTransactions === true,
      includeProducts: includeProducts === "true" || includeProducts === true,
      includePages: includePages === "true" || includePages === true,
      includeSmartCollections:
        includeSmartCollections === "true" || includeSmartCollections === true,
      includeCustomCollections:
        includeCustomCollections === "true" ||
        includeCustomCollections === true,
      resync: resync === "true" || resync === true,
      cancelExisting: cancelExisting === "true" || cancelExisting === true,
    };
    // this.logger.debug('startSync body', body)
    this.logger.debug(`startSync`, options);
    return this.syncService
      .startSync(req.session[`shopify-connect-${req.shop}`], options)
      .catch((error) => {
        this.logger.error(error);
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
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
  @Roles("shopify-staff-member")
  @Get("start")
  async startSync(
    @Req() req: IUserRequest,
    @Query("sync_to_db") syncToDb?: boolean,
    @Query("include_orders") includeOrders?: boolean,
    @Query("include_transactions") includeTransactions?: boolean,
    @Query("include_products") includeProducts?: boolean,
    @Query("include_pages") includePages?: boolean,
    @Query("include_smart_collections") includeSmartCollections?: boolean,
    @Query("include_custom_collections") includeCustomCollections?: boolean,
    @Query("resync") resync?: boolean,
    @Query("cancel_existing") cancelExisting?: boolean
  ) {
    return this.syncService
      .startSync(req.session[`shopify-connect-${req.shop}`], {
        syncToDb,
        includeOrders,
        includeTransactions,
        includeProducts,
        includePages,
        includeSmartCollections,
        includeCustomCollections,
        resync,
        cancelExisting,
      })
      .catch((error) => {
        this.logger.error(error);
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      });
  }

  /**
   * Cancel sync progress
   * @param req
   * @param res
   * @param id
   */
  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Delete()
  async cancel(@Req() req: IUserRequest, @Query("id") id: string) {
    return this.syncService
      .cancelShopSync(req.session[`shopify-connect-${req.shop}`], id)
      .catch((error) => {
        this.logger.error(error);
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      });
  }

  /**
   * @deprecated Use @Delete() instead
   * @param req
   * @param res
   * @param id
   */
  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("cancel")
  async cancelSync(@Req() req: IUserRequest, @Query("id") id: string) {
    return this.cancel(req, id);
  }

  /**
   * Recives the latest sync progress
   * @param req
   * @param res
   * @param query
   */
  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("latest")
  async latestFromShop(@Req() req: IUserRequest) {
    const query = {
      shop: req.shop, // req.shopifyConnect.shop.myshopify_domain,
    };

    return this.syncService
      .findOne(query, { sort: { createdAt: -1 } })
      .catch((error) => {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      });
  }

  /**
   * List sync progresses
   * @param req
   * @param res
   */
  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get()
  async listFromShop(@Req() req: IUserRequest) {
    const query = {
      shop: req.shop, // req.shopifyConnect.shop.myshopify_domain,
    };

    return this.syncService
      .find(query, { sort: { createdAt: -1 } })
      .catch((error) => {
        this.logger.error(error);
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("admin")
  @Get("findOne")
  async findOne(@Query() query) {
    return this.syncService.findOne(query).catch((error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("admin")
  @Get("find")
  async find(@Query() query) {
    return this.syncService.find(query).catch((error) => {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  }
}
