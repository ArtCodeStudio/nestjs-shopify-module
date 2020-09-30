// nest
import { Inject, Injectable } from '@nestjs/common';

// Third party
// import * as pRetry from 'p-retry';
import { shopifyRetry } from '../../helpers';

import { IShopifyConnect } from '../../auth/interfaces';
import { Interfaces, Products, Options } from 'shopify-admin-api';
import { Model } from 'mongoose';
import {
  ProductDocument,
  IListAllCallbackData,
  IAppBasicListOptions,
  IShopifySyncProductCountOptions,
  IShopifySyncProductGetOptions,
  IShopifySyncProductListOptions,
  IAppProductCountOptions,
  IAppProductGetOptions,
  IAppProductListOptions,
} from '../interfaces';

import { EventService } from '../../event.service';
import { SyncProgressDocument, SubSyncProgressDocument, IStartSyncOptions } from '../../interfaces';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';

@Injectable()
export class ProductsService extends ShopifyApiRootCountableService<
Interfaces.Product, // ShopifyObjectType
Products, // ShopifyModelClass
IShopifySyncProductCountOptions, // CountOptions
IShopifySyncProductGetOptions, // GetOptions
IShopifySyncProductListOptions, // ListOptions
ProductDocument // DatabaseDocumentType
> {

  resourceName = 'products';
  subResourceNames = [];

  constructor(
    @Inject('ProductModelToken') protected readonly productModel: (shopName: string) => Model<ProductDocument>,
    @Inject('SyncProgressModelToken') protected readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
  ) {
    super(productModel, Products, eventService, syncProgressModel);
  }

  /**
   * Retrieves a list of products from the app's mongodb database.
   * @param user
   */
  public async listFromDb(user: IShopifyConnect, options: IAppProductListOptions = {}): Promise<Interfaces.Product[]> {

    const query: any = {};

    /**
     * Implements title text search
     */
    if (options.title) {
      // The shopify api also did a full text search here, so we do the same
      query.title = {
        $regex: options.title,
        $options: 'i',
      };
    }

    /**
     * Implements filters
     */
    if (options.vendor) {
      query.vendor = options.vendor;
    }
    if (options.handle) {
      query.handle = options.handle;
    }
    if (options.product_type) {
      query.product_type = options.product_type;
    }
    if (options.collection_id) {
      query.collection_id = options.collection_id;
    }

    /*
     * price min and max
     */
    if (options.price_max) {
      query.price = query.price || {};
      query.price.$lte = options.price_max;
    }
    if (options.price_min) {
      query.price = query.price || {};
      query.price.$gte = options.price_min;
    }

    const basicOptions: IAppBasicListOptions = {
      /**
       * Copied options from shopify
       */
      fields: options.fields,
      limit: options.limit,
      page: options.page,
      created_at_max: options.created_at_max,
      created_at_min: options.created_at_min,
      published_at_max: options.published_at_max,
      published_at_min: options.published_at_min,
      updated_at_max: options.updated_at_max,
      updated_at_min: options.updated_at_min,
      published_status: options.published_status,
      ids: options.ids,
      /**
       * Custom basic options
       */
      sort_by: options.sort_by,
      sort_dir: options.sort_dir,
      text:  options.text,
    };

    return super.listFromDb(user, query, basicOptions);
  }

  /**
   * Creates a new product directly in shopify.
   * @param user
   * @param product
   */
  public async createInShopify(user: IShopifyConnect, product: Interfaces.ProductUpdateCreate): Promise<Interfaces.Product> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return shopifyRetry(() => products.create(product));
  }

  /**
   * Updates a product and its variants and images directly in shopify.
   * @param user
   * @param id
   * @param product
   */
  public async updateInShopify(user: IShopifyConnect, id: number, product: Interfaces.ProductUpdateCreate): Promise<Interfaces.Product> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return shopifyRetry(() => products.update(id, product));
  }

  /**
   * Deletes a product directly in shopify.
   * @param user
   * @param id
   * @param product
   */
  public async deleteInShopify(user: IShopifyConnect, id: number) {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return shopifyRetry(() => products.delete(id));
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
    subProgress: SubSyncProgressDocument,
    options: IStartSyncOptions,
    data: IListAllCallbackData<Interfaces.Product>,
  ): Promise<void> {
    const products = data.data;
    subProgress.syncedCount += products.length;
    const lastProduct = products[products.length - 1];
    subProgress.lastId = lastProduct.id;
    subProgress.info = lastProduct.title;
  }

}
