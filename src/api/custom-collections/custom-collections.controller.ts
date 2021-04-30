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
import { IUserRequest } from "../../interfaces/user-request";

import { ShopifyApiGuard } from "../../guards/shopify-api.guard";
import { Roles } from "../../guards/roles.decorator";
import { DebugService } from "../../debug.service";

import { Options } from "shopify-admin-api";

import { CustomCollectionsService } from "./custom-collections.service";

@Controller("shopify/api/custom-collections")
export class CustomCollectionsController {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    protected readonly customCollectionsService: CustomCollectionsService
  ) {}

  @UseGuards(ShopifyApiGuard)
  @Roles() // Empty == Allowed from shop frontend and backend
  @Get()
  async list(
    @Req() req: IUserRequest,
    /**
     * The number of results to show.
     */
    @Query("limit") limit = 50,
    /**
     * The page of results to show.
     */
    @Query("page") page = 1,
    /**
     * Show only the results specified in this comma-separated list of IDs.
     */
    @Query("ids") ids?: string,
    /**
     * Restrict results to after the specified ID.
     */
    @Query("since_id") since_id?: number,
    /**
     * Show smart collections with the specified title.
     */
    @Query("title") title?: string,
    /**
     * Show smart collections that includes the specified product.
     */
    @Query("product_id") product_id?: number,
    /**
     * Filter results by smart collection handle.
     */
    @Query("handle") handle?: string,
    /**
     * Show smart collections last updated after this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query("updated_at_min") updated_at_min?: string,
    /**
     * Show smart collections last updated before this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query("updated_at_max") updated_at_max?: string,
    /**
     * Show smart collections published after this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query("published_at_min") published_at_min?: string,
    /**
     * Show smart collections published before this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query("published_at_max") published_at_max?: string,
    /**
     * Filter results based on the published status of smart collections.
     */
    @Query("published_status")
    published_status: "published" | "unpublished" | "any" = "any",
    /**
     * Show only certain fields, specified by a comma-separated list of field names.
     */
    @Query("fields") fields?: string
  ) {
    const options: Options.CollectionListOptions = {
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
      return await this.customCollectionsService.listFromShopify(
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
  async listFromDb(@Req() req: IUserRequest) {
    try {
      return await this.customCollectionsService.listFromDb(
        req.session[`shopify-connect-${req.shop}`],
        {},
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
    @Query() options: Options.CollectionListOptions
  ) {
    this.customCollectionsService
      .listAllFromShopifyStream(
        req.session[`shopify-connect-${req.shop}`],
        options
      )
      .pipe(res);
  }

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get("db/count")
  async countFromDb(
    @Req() req: IUserRequest,
    @Query() options: Options.CollectionCountOptions
  ) {
    try {
      return await this.customCollectionsService.countFromDb(
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
      return await this.customCollectionsService.diffSynced(
        req.session[`shopify-connect-${req.shop}`]
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles() // Empty == Allowed from shop frontend and backend
  @Get("count")
  async countFromShopify(
    @Req() req: IUserRequest,
    /**
     * Show smart collections with the specified title.
     */
    @Query("title") title?: string,
    /**
     * Show smart collections that include the specified product.
     */
    @Query("product_id") product_id?: number,
    /**
     * Show smart collections last updated after this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query("updated_at_min") updated_at_min?: string,
    /**
     * Show smart collections last updated before this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query("updated_at_max") updated_at_max?: string,
    /**
     * Show smart collections published after this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query("published_at_min") published_at_min?: string,
    /**
     * Show smart collections published before this date. (format: 2014-04-25T16:15:47-04:00)
     */
    @Query("published_at_max") published_at_max?: string,
    /**
     * Filter results based on the published status of smart collections.
     */
    @Query("published_status")
    published_status: "published" | "unpublished" | "any" = "any"
  ) {
    const options: Options.CollectionCountOptions = {
      title,
      product_id,
      updated_at_min,
      updated_at_max,
      published_at_min,
      published_at_max,
      published_status,
    };
    try {
      return await this.customCollectionsService.countFromShopify(
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
      return await this.customCollectionsService.getFromDb(
        req.session[`shopify-connect-${req.shop}`],
        id
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(ShopifyApiGuard)
  @Roles() // Empty == Allowed from shop frontend and backend
  @Get(":id")
  async getFromShopify(
    @Req() req: IUserRequest,
    @Param("id") id: number,
    @Query("fields") fields?: string
  ) {
    const options: Options.CollectionGetOptions = {
      fields,
    };
    try {
      return await this.customCollectionsService.getFromShopify(
        req.session[`shopify-connect-${req.shop}`],
        id,
        options
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
