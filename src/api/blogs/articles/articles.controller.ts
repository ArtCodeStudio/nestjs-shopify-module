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

import { ArticlesService } from "./articles.service";
import { DebugService } from "../../../debug.service";
import { ShopifyApiGuard } from "../../../guards/shopify-api.guard";
import { Roles } from "../../../guards/roles.decorator";

// Interfaces
import { Interfaces } from "shopify-admin-api";
import { IUserRequest } from "../../../interfaces/user-request";
import { IShopifySyncArticleListOptions } from "../../interfaces";

@Controller("shopify/api/blogs")
export class ArticlesController {
  constructor(protected readonly articlesService: ArticlesService) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Creates a new article in shopify.
   * @param req
   * @param id
   * @param article
   */
  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Post(":blog_id/articles")
  async createInShopify(
    @Req() req: IUserRequest,
    @Param("blog_id") blogId: number,
    @Body() article: Interfaces.Article
  ) {
    this.logger.debug("create article: %O", article);
    try {
      return this.articlesService
        .create(req.session[`shopify-connect-${req.shop}`], blogId, article)
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
   * Retrieves a list of articles directly from shopify.
   * @param req
   * @param options
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get(":blog_id/articles")
  async listFromShopify(
    @Req() req: IUserRequest,
    @Param("blog_id") blogId: number,
    /*
     * Options from shopify
     */
    @Query("author") author?: string,
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
    @Query("tag") tag?: string,
    @Query("updated_at_max") updated_at_max?: string,
    @Query("updated_at_min") updated_at_min?: string,
    /**
     * Custom sync options
     */
    @Query("sync_to_db") syncToDb?: boolean,
    @Query("cancel_signal") cancelSignal?: string,
    @Query("fail_on_sync_error") failOnSyncError?: boolean
  ) {
    try {
      if (req.session.isThemeClientRequest) {
        published_status = "published"; // For security reasons, only return public articles if the request comes not from a logged in user
        syncToDb = false;
      }
      const options: IShopifySyncArticleListOptions = {
        author,
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
        tag,
        syncToDb,
        updated_at_max,
        updated_at_min,
        cancelSignal,
        failOnSyncError,
      };

      this.logger.debug("ArticleListOptions", options);
      return await this.articlesService.list(
        req.session[`shopify-connect-${req.shop}`],
        blogId,
        options
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves a count of articles directly from shopify.
   * @param req
   * @param options
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get(":blog_id/articles/count")
  async countFromShopify(
    @Req() req: IUserRequest,
    @Param("blog_id") blogId: number,
    @Query("created_at_max") created_at_max: string,
    @Query("created_at_min") created_at_min: string,
    @Query("published_status")
    published_status: "published" | "unpublished" | "any",
    @Query("published_at_max") published_at_max: string,
    @Query("published_at_min") published_at_min: string,
    @Query("updated_at_max") updated_at_max: string,
    @Query("updated_at_min") updated_at_min: string
  ) {
    try {
      if (req.session.isThemeClientRequest) {
        published_status = "published"; // For security reasons, only return public articles if the request comes not from a logged in user
      }
      return await this.articlesService.count(
        req.session[`shopify-connect-${req.shop}`],
        blogId,
        {
          created_at_max,
          created_at_min,
          published_at_max,
          published_at_min,
          published_status,
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
   * Retrieves a single article directly from shopify.
   * @param req
   * @param id article id
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @Get(":blog_id/articles/:id")
  async getFromShopify(
    @Req() req: IUserRequest,
    @Param("blog_id") blogId: number,
    @Param("id") id: number
  ) {
    try {
      return await this.articlesService.get(
        req.session[`shopify-connect-${req.shop}`],
        blogId,
        id
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Deletes a article with the given id directly in shopify.
   * @param req
   * @param id Id of the article being deleted.
   */
  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Delete(":blog_id/articles/:article_id")
  async deleteInShopify(
    @Req() req: IUserRequest,
    @Param("blog_id") blogId: number,
    @Param("article_id") id: number
  ) {
    try {
      return await this.articlesService.delete(
        req.session[`shopify-connect-${req.shop}`],
        blogId,
        id
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Updates a article directly from shopify.
   * @param req
   * @param id Article id
   * @param article
   */
  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Put(":blog_id/articles/:article_id")
  async updateInShopify(
    @Req() req: IUserRequest,
    @Param("blog_id") blogId: number,
    @Param("article_id") id: number,
    @Body() article: Partial<Interfaces.Article>
  ) {
    this.logger.debug("update article", id, article);
    try {
      return await this.articlesService.update(
        req.session[`shopify-connect-${req.shop}`],
        blogId,
        id,
        article
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
