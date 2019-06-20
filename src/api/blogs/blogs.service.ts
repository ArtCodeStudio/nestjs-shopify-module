import { Inject, Injectable } from '@nestjs/common';
import { deleteUndefinedProperties } from '../../helpers';
import { EventService } from '../../event.service';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';
import { ElasticsearchService } from '../../elasticsearch.service';
import { SwiftypeService } from '../../swiftype.service';

// Interfaces
import { Model } from 'mongoose';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Blog } from 'shopify-prime/models';
import { Blogs, Options } from 'shopify-prime';
import {
  BlogDocument,
  IListAllCallbackData,
  IShopifySyncBlogCountOptions,
  IShopifySyncBlogGetOptions,
  IShopifySyncBlogListOptions,
  IAppBlogCountOptions,
  IAppBlogGetOptions,
  IAppBlogListOptions,
} from '../interfaces';
import {
  SyncProgressDocument,
  ISubSyncProgress,
  IStartSyncOptions,
  ShopifyModuleOptions,
} from '../../interfaces';

@Injectable()
export class BlogsService extends ShopifyApiRootCountableService<
Blog, // ShopifyObjectType
Blogs, // ShopifyModelClass
IShopifySyncBlogCountOptions, // CountOptions
IShopifySyncBlogGetOptions, // GetOptions
IShopifySyncBlogListOptions, // ListOptions
BlogDocument // DatabaseDocumentType
> {

  resourceName = 'blogs';
  subResourceNames = [];

  constructor(
    protected readonly esService: ElasticsearchService,
    @Inject('BlogModelToken')
    private readonly blogModel: (shopName: string) => Model<BlogDocument>,
    protected readonly swiftypeService: SwiftypeService,
    private readonly eventService: EventService,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
  ) {
    super(esService, blogModel, swiftypeService, Blogs, eventService, syncProgressModel);
  }

  /**
   * Creates a new blog.
   * @param user
   * @param blog The blog being created.
   */
  public async create(user: IShopifyConnect, blog: Partial<Blog>): Promise<Blog> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    return blogs.create(blog)
    .then((blogObj) => {
      return blogObj;
    });
  }

  /**
   * Retrieves a single blog by its ID.
   * @param user
   * @param id Id of the blog to retrieve.
   * @param options Options for filtering the result.
   */
  public async get(user: IShopifyConnect, id: number, options?: Options.FieldOptions): Promise<Partial<Blog>> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    return blogs.get(id, options)
    .then((blog) => {
      return blog;
    });
  }

  /**
   * Updates a blog with the given id.
   * @param user
   * @param id Id of the blog being updated.
   * @param blog The updated blog.
   */
  public async update(user: IShopifyConnect, id: number, blog: Partial<Blog>): Promise<Blog> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    return blogs.update(id, blog)
    .then((blogObj) => {
      return blogObj;
    });
  }

  /**
   * Retrieve a list of all blogs.
   * @param user
   * @param options Options for filtering the results.
   */
  public async list(user: IShopifyConnect, options?: Options.FieldOptions): Promise<Partial<Blog>[]> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    return blogs.list(options)
    .then((blogObj) => {
      return blogObj;
    });
  }

  /**
   * Retrieves a blog count.
   * @param user
   * @param options
   */
  public async count(user: IShopifyConnect, options?: Options.BlogCountOptions): Promise<number> {
    const blogs = new Blogs(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    this.logger.debug('count options', options);
    return blogs.count(options)
    .then((count) => {
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
    return blogs.delete(id)
    .then((result) => {
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
    data: IListAllCallbackData<Blog>,
  ): Promise<void> {
    const blogs = data.data;
    subProgress.syncedCount += blogs.length;
    const lastBlog = blogs[blogs.length - 1];
    subProgress.lastId = lastBlog.id;
    subProgress.info = lastBlog.title;
  }

}
