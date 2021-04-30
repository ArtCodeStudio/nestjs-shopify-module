import { Inject, Injectable } from "@nestjs/common";
import { deleteUndefinedProperties } from "../../helpers";
import { EventService } from "../../event.service";
import { ShopifyApiRootCountableService } from "../shopify-api-root-countable.service";

// Interfaces
import { Model } from "mongoose";
import { IShopifyConnect } from "../../auth/interfaces/connect";
import { Pages, Options, Interfaces } from "shopify-admin-api";
import { PageDocument, IListAllCallbackData } from "../interfaces";
import {
  SyncProgressDocument,
  ISubSyncProgress,
  IStartSyncOptions,
  ShopifyModuleOptions,
  Resource,
} from "../../interfaces";
import { SHOPIFY_MODULE_OPTIONS } from "../../shopify.constants";

@Injectable()
export class PagesService extends ShopifyApiRootCountableService<
  Interfaces.Page, // ShopifyObjectType
  Pages, // ShopifyModelClass
  Options.PageCountOptions, // CountOptions
  Options.PageGetOptions, // GetOptions
  Options.PageListOptions, // ListOptions
  PageDocument // DatabaseDocumentType
> {
  resourceName: Resource = "pages";
  subResourceNames: Resource[] = [];

  constructor(
    @Inject("PageModelToken")
    private readonly pageModel: (shopName: string) => Model<PageDocument>,
    private readonly eventService: EventService,
    @Inject("SyncProgressModelToken")
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    protected readonly shopifyModuleOptions: ShopifyModuleOptions
  ) {
    super(
      pageModel,
      Pages,
      eventService,
      syncProgressModel,
      shopifyModuleOptions
    );
  }

  /**
   * Creates a new page.
   * @param user
   * @param page The page being created.
   */
  public async create(
    user: IShopifyConnect,
    page: Partial<Interfaces.Page>
  ): Promise<Interfaces.Page> {
    const pages = new Pages(user.myshopify_domain, user.accessToken);
    return pages.create(page).then((pageObj) => {
      return pageObj;
    });
  }

  /**
   * Retrieves a single page by its ID.
   * @param user
   * @param id Id of the page to retrieve.
   * @param options Options for filtering the result.
   */
  public async get(
    user: IShopifyConnect,
    id: number,
    options?: Options.FieldOptions
  ): Promise<Partial<Interfaces.Page>> {
    const pages = new Pages(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    return pages.get(id, options).then((page) => {
      return page;
    });
  }

  /**
   * Updates a page with the given id.
   * @param user
   * @param id Id of the page being updated.
   * @param page The updated page.
   */
  public async update(
    user: IShopifyConnect,
    id: number,
    page: Partial<Interfaces.Page>
  ): Promise<Interfaces.Page> {
    const pages = new Pages(user.myshopify_domain, user.accessToken);
    return pages.update(id, page).then((pageObj) => {
      return pageObj;
    });
  }

  /**
   * Retrieve a list of all pages.
   * @param user
   * @param options Options for filtering the results.
   */
  public async list(
    user: IShopifyConnect,
    options?: Options.FieldOptions
  ): Promise<Partial<Interfaces.Page>[]> {
    const pages = new Pages(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    return pages.list(options).then((pageObj) => {
      return pageObj;
    });
  }

  /**
   * Retrieves a page count.
   * @param user
   * @param options
   */
  public async count(
    user: IShopifyConnect,
    options?: Options.PageCountOptions
  ): Promise<number> {
    const pages = new Pages(user.myshopify_domain, user.accessToken);
    options = deleteUndefinedProperties(options);
    this.logger.debug("count options: %O", options);
    return pages.count(options).then((count) => {
      return count;
    });
  }

  /**
   * Deletes a page with the given id.
   * @param user
   * @param id Id of the page being deleted.
   */
  public async delete(
    user: IShopifyConnect,
    id: number
  ): Promise<{ id: number }> {
    const pages = new Pages(user.myshopify_domain, user.accessToken);
    return pages.delete(id).then((result) => {
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
    data: IListAllCallbackData<Interfaces.Page>
  ): Promise<void> {
    const pages = data.data;
    subProgress.syncedCount += pages.length;
    const lastPage = pages[pages.length - 1];
    subProgress.lastId = lastPage.id;
    subProgress.info = lastPage.title;
  }
}
