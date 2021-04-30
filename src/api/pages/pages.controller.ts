import {
  Controller,
  Param,
  Query,
  UseGuards,
  Req,
  Get,
  Put,
  Post,
  Delete,
  HttpStatus,
  HttpException,
  Body,
} from "@nestjs/common";

import { PagesService } from "./pages.service";
import { DebugService } from "../../debug.service";
import { ShopifyApiGuard } from "../../guards/shopify-api.guard";
import { Roles } from "../../guards/roles.decorator";

// Interfaces
import { Interfaces, Options } from "shopify-admin-api";
import { IUserRequest } from "../../interfaces/user-request";

@Controller("shopify/api/pages")
export class PagesController {
  constructor(protected readonly pagesService: PagesService) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Creates a new page in shopify.
   * @param req
   * @param res
   * @param id
   * @param page
   */
  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Post()
  async createInShopify(
    @Req() req: IUserRequest,
    @Body() page: Interfaces.Page
  ) {
    this.logger.debug("create page: %O", page);
    try {
      return await this.pagesService
        .create(req.session[`shopify-connect-${req.shop}`], page)
        .then((result) => {
          this.logger.debug("result: %O", result);
          return result;
        });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
    /*
     * Options from shopify
     */
    @Query("created_at_max") created_at_max?: string,
    @Query("created_at_min") created_at_min?: string,
    @Query("page") page?: number,
    @Query("fields") fields?: string,
    @Query("handle") handle?: string,
    @Query("limit") limit?: number,
    @Query("published_at_max") published_at_max?: string,
    @Query("published_at_min") published_at_min?: string,
    @Query("published_status")
    published_status?: "published" | "unpublished" | "any",
    @Query("since_id") since_id?: number,
    @Query("title") title?: string,
    @Query("updated_at_max") updated_at_max?: string,
    @Query("updated_at_min") updated_at_min?: string
  ) {
    try {
      if (req.session.isThemeClientRequest) {
        published_status = "published"; // For security reasons, only return public pages if the request comes not from a logged in user
      }
      const options: Options.PageListOptions = {
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
        title,
        updated_at_max,
        updated_at_min,
      };

      this.logger.debug("PageListOptions: %O", options);
      return await this.pagesService.list(
        req.session[`shopify-connect-${req.shop}`],
        options
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
  @Get("count")
  async countFromShopify(
    @Req() req: IUserRequest,
    @Query("created_at_max") created_at_max: string,
    @Query("created_at_min") created_at_min: string,
    @Query("published_status")
    published_status: "published" | "unpublished" | "any",
    @Query("title") title: string,
    @Query("published_at_max") published_at_max: string,
    @Query("published_at_min") published_at_min: string,
    @Query("updated_at_max") updated_at_max: string,
    @Query("updated_at_min") updated_at_min: string
  ) {
    try {
      if (req.session.isThemeClientRequest) {
        published_status = "published"; // For security reasons, only return public pages if the request comes not from a logged in user
      }
      return await this.pagesService.count(
        req.session[`shopify-connect-${req.shop}`],
        {
          created_at_max,
          created_at_min,
          published_at_max,
          published_at_min,
          published_status,
          title,
          updated_at_max,
          updated_at_min,
        }
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
  @Get(":id")
  async getFromShopify(@Req() req: IUserRequest, @Param("id") id: number) {
    try {
      return await this.pagesService.get(
        req.session[`shopify-connect-${req.shop}`],
        id
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Deletes a page with the given id directly in shopify.
   * @param req
   * @param res
   * @param id Id of the page being deleted.
   */
  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Delete(":page_id")
  async deleteInShopify(
    @Req() req: IUserRequest,
    @Param("page_id") id: number
  ) {
    try {
      return await this.pagesService.delete(
        req.session[`shopify-connect-${req.shop}`],
        id
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
  @Roles("shopify-staff-member")
  @Put(":page_id")
  async updateInShopify(
    @Req() req: IUserRequest,
    @Param("page_id") id: number,
    @Body() page: Partial<Interfaces.Page>
  ) {
    this.logger.debug("update page id: %d, page: %O", id, page);
    try {
      return await this.pagesService.update(
        req.session[`shopify-connect-${req.shop}`],
        id,
        page
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
