import {
  Controller,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  Get,
  HttpStatus,
  HttpException,
  Header,
} from "@nestjs/common";
import { Response } from "express";
import { OrdersService } from "./orders.service";
import { DebugService } from "../../debug.service";

import { ShopifyApiGuard } from "../../guards/shopify-api.guard";
import { Roles } from "../../guards/roles.decorator";

import { Interfaces } from "shopify-admin-api";

// Interfaces
import { IUserRequest } from "../../interfaces/user-request";
import { IAppOrderListOptions } from "../interfaces";
import { Options } from "shopify-admin-api";

@Controller("shopify/api/orders")
export class OrdersController {
  constructor(protected readonly ordersService: OrdersService) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get()
  async listFromShopify(
    @Req() req: IUserRequest,
    /*
     * Options from shopify
     */
    @Query("created_at_max") created_at_max?: string,
    @Query("created_at_min") created_at_min?: string,
    @Query("fields") fields?: string,
    @Query("financial_status")
    financial_status?: Interfaces.Order["financial_status"],
    @Query("fulfillment_status")
    fulfillment_status?: Interfaces.Order["fulfillment_status"],
    @Query("limit") limit?: number,
    @Query("page") page?: number,
    @Query("processed_at_max") processed_at_max?: string,
    @Query("processed_at_min") processed_at_min?: string,
    @Query("since_id") since_id?: number,
    @Query("status") status = "any",
    @Query("updated_at_max") updated_at_max?: string,
    @Query("updated_at_min") updated_at_min?: string
  ) {
    try {
      const options: Options.OrderListOptions = {
        created_at_max,
        created_at_min,
        fields,
        financial_status,
        fulfillment_status: fulfillment_status as any, // TODO
        limit,
        page,
        processed_at_max,
        processed_at_min,
        since_id,
        status,
        updated_at_max,
        updated_at_min,
      };
      return await this.ordersService.listFromShopify(
        req.session[`shopify-connect-${req.shop}`],
        options
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("db")
  async listFromDb(
    @Req() req: IUserRequest,
    /*
     * Options from shopify
     */
    @Query() options: IAppOrderListOptions
  ) {
    try {
      return await this.ordersService.listFromDb(
        req.session[`shopify-connect-${req.shop}`],
        options,
        {}
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("all")
  @Header("Content-type", "application/json")
  listAllFromShopify(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query() options: Options.OrderListOptions
  ) {
    this.ordersService
      .listAllFromShopifyStream(req.session[`shopify-connect-${req.shop}`], {
        ...options,
        status: "any",
      })
      .pipe(res);
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("db/count")
  async countFromDb(
    @Req() req: IUserRequest,
    @Query() options: Options.OrderCountOptions
  ) {
    try {
      return await this.ordersService.countFromDb(
        req.session[`shopify-connect-${req.shop}`],
        options
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("db/diff")
  async diffSynced(@Req() req: IUserRequest) {
    try {
      return await this.ordersService.diffSynced(
        req.session[`shopify-connect-${req.shop}`]
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("count")
  async countFromShopify(
    @Req() req: IUserRequest,
    @Query() options: Options.OrderCountOptions
  ) {
    try {
      return await this.ordersService.countFromShopify(
        req.session[`shopify-connect-${req.shop}`],
        options
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get(":id/db")
  async getFromDb(@Req() req: IUserRequest, @Param("id") id: number) {
    try {
      return await this.ordersService.getFromDb(
        req.session[`shopify-connect-${req.shop}`],
        id
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("sync-progress/all")
  async listSyncProgress(@Req() req: IUserRequest) {
    try {
      return await this.ordersService.listSyncProgress(
        req.session[`shopify-connect-${req.shop}`]
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("sync-progress")
  async getLastSyncProgress(@Req() req: IUserRequest) {
    try {
      return await this.ordersService.getLastSyncProgress(
        req.session[`shopify-connect-${req.shop}`]
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get(":id")
  async getFromShopify(@Req() req: IUserRequest, @Param("id") id: number) {
    try {
      return await this.ordersService.getFromShopify(
        req.session[`shopify-connect-${req.shop}`],
        id
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
