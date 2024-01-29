import { Inject, Injectable } from "@nestjs/common";
import { deleteUndefinedProperties } from "../../../helpers";
import { EventService } from "../../../event.service";
import { ShopifyApiChildCountableService } from "../../shopify-api-child-countable.service";

// Interfaces
import { Model } from "mongoose";
import { IShopifyConnect } from "../../../auth/interfaces/connect";
import { Interfaces, Articles, Options } from "shopify-admin-api";
import {
  ArticleDocument,
  IListAllCallbackData,
  IShopifySyncArticleCountOptions,
  IShopifySyncArticleGetOptions,
  IShopifySyncArticleListOptions,
} from "../../interfaces";
import {
  SyncProgressDocument,
  ISubSyncProgress,
  IStartSyncOptions,
  ShopifyModuleOptions,
  Resource,
} from "../../../interfaces";
import { SHOPIFY_MODULE_OPTIONS } from "../../../shopify.constants";

@Injectable()
export class ArticlesService extends ShopifyApiChildCountableService<
  Interfaces.Article, // ShopifyObjectType
  Articles, // ShopifyModelClass
  IShopifySyncArticleCountOptions, // CountOptions
  IShopifySyncArticleGetOptions, // GetOptions
  IShopifySyncArticleListOptions, // ListOptions
  ArticleDocument // DatabaseDocumentType
> {
  resourceName: Resource = "articles";
  subResourceNames: Resource[] = [];

  constructor(
    @Inject("ArticleModelToken")
    private readonly articleModel: (shopName: string) => Model<ArticleDocument>,
    private readonly eventService: EventService,
    @Inject("SyncProgressModelToken")
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    protected readonly shopifyModuleOptions: ShopifyModuleOptions
  ) {
    super(articleModel, Articles, eventService, shopifyModuleOptions);
  }

  /**
   * Creates a new article.
   * @param user
   * @param blogId The ID of the blog containing the article.
   * @param article The article being created.
   */
  public async create(
    user: IShopifyConnect,
    blogId: number,
    article: Partial<Interfaces.Article>
  ): Promise<Interfaces.Article> {
    const articles = new Articles(user.myshopify_domain, user.accessToken);
    return articles.create(blogId, article).then((articleObj) => {
      return articleObj;
    });
  }

  /**
   * Retrieves a single article by its ID.
   * @param user
   * @param blogId The ID of the blog containing the article.
   * @param id Id of the article to retrieve.
   * @param options Options for filtering the result.
   */
  public async get(
    user: IShopifyConnect,
    blogId: number,
    id: number,
    options?: Options.FieldOptions
  ): Promise<Partial<Interfaces.Article>> {
    const articles = new Articles(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    return articles.get(blogId, id, options).then((article) => {
      return article;
    });
  }

  /**
   * Updates a article with the given id.
   * @param user
   * @param blogId The ID of the blog containing the article.
   * @param id Id of the article being updated.
   * @param article The updated article.
   */
  public async update(
    user: IShopifyConnect,
    blogId: number,
    id: number,
    article: Partial<Interfaces.Article>
  ): Promise<Interfaces.Article> {
    const articles = new Articles(user.myshopify_domain, user.accessToken);
    return articles.update(blogId, id, article).then((articleObj) => {
      return articleObj;
    });
  }

  /**
   * Retrieve a list of all articles.
   * @param user
   * @param blogId The ID of the blog containing the article.
   * @param options Options for filtering the results.
   */
  public async list(
    user: IShopifyConnect,
    blogId: number,
    options?: Options.ArticleListOptions
  ): Promise<Partial<Interfaces.Article>[]> {
    const articles = new Articles(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    return articles.list(blogId, options).then((articleObj) => {
      return articleObj;
    });
  }

  /**
   * Retrieves a article count.
   * @param user
   * @param blogId The ID of the blog containing the article.
   * @param options
   */
  public async count(
    user: IShopifyConnect,
    blogId: number,
    options?: Options.ArticleCountOptions
  ): Promise<number> {
    const articles = new Articles(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    this.logger.debug("count options: %O", options);
    return articles.count(blogId, options).then((count) => {
      return count;
    });
  }

  /**
   * Deletes a article with the given id.
   * @param user
   * @param blogId The ID of the blog containing the article.
   * @param id Id of the article being deleted.
   */
  public async delete(
    user: IShopifyConnect,
    blogId: number,
    id: number
  ): Promise<void> {
    const articles = new Articles(user.myshopify_domain, user.accessToken);
    return articles.delete(blogId, id).then((result) => {
      return result;
    });
  }

  /**
   *
   * @param shopifyConnect
   * @param subProgress
   * @param options
   * @param data
   */
  async syncedDataCallback(
    shopifyConnect: IShopifyConnect,
    progress: SyncProgressDocument,
    subProgress: ISubSyncProgress,
    options: IStartSyncOptions,
    data: IListAllCallbackData<Interfaces.Article>
  ): Promise<void> {
    const articles = data.data;
    subProgress.syncedCount += articles.length;
    const lastArticle = articles[articles.length - 1];
    subProgress.lastId = lastArticle.id;
    subProgress.info = lastArticle.title;
  }
}
