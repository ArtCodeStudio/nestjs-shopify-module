import { Inject, Injectable } from "@nestjs/common";
import { deleteUndefinedProperties } from "../../helpers";
import { EventService } from "../../event.service";
import { ShopifyApiRootCountableService } from "../shopify-api-root-countable.service";
import { mongooseParallelRetry } from "../../helpers";

// Interfaces
import { Model } from "mongoose";
import { IShopifyConnect } from "../../auth/interfaces/connect";
import { Interfaces } from "shopify-admin-api";
import { Blogs, Options } from "shopify-admin-api";
import { ArticlesService } from "./articles/articles.service";
import {
  BlogDocument,
  IListAllCallbackData,
  IShopifySyncBlogCountOptions,
  IShopifySyncBlogGetOptions,
  IShopifySyncBlogListOptions,
} from "../interfaces";
import {
  SyncProgressDocument,
  IStartSyncOptions,
  ShopifyModuleOptions,
  BlogSyncProgressDocument,
  Resource,
} from "../../interfaces";
import { SHOPIFY_MODULE_OPTIONS } from "../../shopify.constants";

@Injectable()
export class BlogsService extends ShopifyApiRootCountableService<
  Interfaces.Blog, // ShopifyObjectType
  Blogs, // ShopifyModelClass
  IShopifySyncBlogCountOptions, // CountOptions
  IShopifySyncBlogGetOptions, // GetOptions
  IShopifySyncBlogListOptions, // ListOptions
  BlogDocument // DatabaseDocumentType
> {
  resourceName: Resource = "blogs";
  subResourceNames: Resource[] = [];

  constructor(
    @Inject("BlogModelToken")
    private readonly blogModel: (shopName: string) => Model<BlogDocument>,
    private readonly eventService: EventService,
    @Inject("SyncProgressModelToken")
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    private readonly articlesService: ArticlesService,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    protected readonly shopifyModuleOptions: ShopifyModuleOptions
  ) {
    super(
      blogModel,
      Blogs,
      eventService,
      syncProgressModel,
      shopifyModuleOptions
    );
  }

  /**
   * Creates a new blog.
   * @param user
   * @param blog The blog being created.
   */
  public async create(
    user: IShopifyConnect,
    blog: Partial<Interfaces.Blog>
  ): Promise<Interfaces.Blog> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    return blogs.create(blog).then((blogObj) => {
      return blogObj;
    });
  }

  /**
   * Retrieves a single blog by its ID.
   * @param user
   * @param id Id of the blog to retrieve.
   * @param options Options for filtering the result.
   */
  public async get(
    user: IShopifyConnect,
    id: number,
    options?: Options.FieldOptions
  ): Promise<Partial<Interfaces.Blog>> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    return blogs.get(id, options).then((blog) => {
      return blog;
    });
  }

  /**
   * Updates a blog with the given id.
   * @param user
   * @param id Id of the blog being updated.
   * @param blog The updated blog.
   */
  public async update(
    user: IShopifyConnect,
    id: number,
    blog: Partial<Interfaces.Blog>
  ): Promise<Interfaces.Blog> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    return blogs.update(id, blog).then((blogObj) => {
      return blogObj;
    });
  }

  /**
   * Retrieve a list of all blogs.
   * @param user
   * @param options Options for filtering the results.
   */
  public async list(
    user: IShopifyConnect,
    options?: Options.FieldOptions
  ): Promise<Partial<Interfaces.Blog>[]> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    return blogs.list(options).then((blogObj) => {
      return blogObj;
    });
  }

  /**
   * Retrieves a blog count.
   * @param user
   * @param options
   */
  public async count(
    user: IShopifyConnect,
    options?: Options.BlogCountOptions
  ): Promise<number> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    this.logger.debug("count options: %O", options);
    return blogs.count(options).then((count) => {
      return count;
    });
  }

  /**
   * Deletes a blog with the given id.
   * @param user
   * @param id Id of the blog being deleted.
   */
  public async delete(user: IShopifyConnect, id: number): Promise<void> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    return blogs.delete(id).then((result) => {
      return result;
    });
  }

  /**
   * Sub-routine to configure the sync.
   * In case of blogs we have to check if articles should be included.
   *
   * @param shopifyConnect
   * @param subProgress
   * @param options
   * @param data
   */
  protected async syncedDataCallback(
    shopifyConnect: IShopifyConnect,
    progress: SyncProgressDocument,
    subProgress: BlogSyncProgressDocument,
    options: IStartSyncOptions,
    data: IListAllCallbackData<Interfaces.Blog>
  ): Promise<void> {
    const blogs = data.data;
    const lastBlog = blogs[blogs.length - 1];
    if (options.includeTransactions) {
      for (const blog of blogs) {
        const articles = await this.articlesService.listFromShopify(
          shopifyConnect,
          blog.id,
          {
            syncToDb: options.syncToDb,
          }
        );
        subProgress.syncedArticlesCount += articles.length;
        subProgress.syncedCount++;
        subProgress.lastId = blog.id;
        subProgress.info = blog.title;
        await mongooseParallelRetry(() => {
          return progress.save();
        });
      }
    } else {
      subProgress.syncedCount += blogs.length;
      subProgress.lastId = lastBlog.id;
      subProgress.info = lastBlog.title;
    }
  }
}
