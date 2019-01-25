// nest
import { Inject, Injectable } from '@nestjs/common';

// Third party
import * as pRetry from 'p-retry';
import { GenericParams as ESGenericParams } from 'elasticsearch';

import { IShopifyConnect } from '../../auth/interfaces';
import { Products, Options } from 'shopify-prime';
import { Product, ProductUpdateCreate } from 'shopify-prime/models';
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
import { ElasticsearchService } from '../../elasticsearch.service';

@Injectable()
export class ProductsService extends ShopifyApiRootCountableService<
Product, // ShopifyObjectType
Products, // ShopifyModelClass
IShopifySyncProductCountOptions, // CountOptions
IShopifySyncProductGetOptions, // GetOptions
IShopifySyncProductListOptions, // ListOptions
ProductDocument // DatabaseDocumentType
> {

  resourceName = 'products';
  subResourceNames = [];

  constructor(
    protected readonly esService: ElasticsearchService,
    @Inject('ProductModelToken')
    protected readonly productModel: (shopName: string) => Model<ProductDocument>,
    @Inject('SyncProgressModelToken')
    protected readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
  ) {
    super(esService, productModel, Products, eventService, syncProgressModel);
  }

  /**
   * Retrieves a list of products from the app's mongodb database.
   * @param user
   */
  public async listFromDb(user: IShopifyConnect, options: IAppProductListOptions = {}): Promise<Product[]> {

    const query: any = {};

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
      sort_by: options.sort_by,
      sort_dir: options.sort_dir,
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
    };

    return super.listFromDb(user, query, basicOptions);
  }

  /**
   * Retrieves a list of products from elasticsearch.
   * @param user
   * @param body see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html
   * and https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
   */
  public async listFromSearch(user: IShopifyConnect, options: IAppProductListOptions = {}): Promise<Product[]> {

    const body = {
      query: {
        range: {},
      } as any,
    };

    /*
     * price min and max
     */
    if (options.price_max) {
      body.query.range.price = body.query.range.price || {};
      body.query.range.price = {
        lte: options.price_max,
      };
    }
    if (options.price_min) {
       body.query.range.price =  body.query.range.price || {};
       body.query.range.price = {
        gte: options.price_min,
      };
    }

    const basicOptions: IAppBasicListOptions = {
      sort_by: options.sort_by,
      sort_dir: options.sort_dir,
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
    };

    return super.listFromSearch(user, body, basicOptions);
  }

  /**
   * Creates a new product directly in shopify.
   * @param user
   * @param product
   */
  public async createInShopify(user: IShopifyConnect, product: ProductUpdateCreate): Promise<Product> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return pRetry(() => products.create(product));
  }

  /**
   * Updates a product and its variants and images directly in shopify.
   * @param user
   * @param id
   * @param product
   */
  public async updateInShopify(user: IShopifyConnect, id: number, product: ProductUpdateCreate): Promise<Product> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return pRetry(() => products.update(id, product));
  }

  /**
   * Deletes a product directly in shopify.
   * @param user
   * @param id
   * @param product
   */
  public async deleteInShopify(user: IShopifyConnect, id: number) {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return pRetry(() => products.delete(id));
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
    subProgress: SubSyncProgressDocument,
    options: IStartSyncOptions,
    data: IListAllCallbackData<Product>,
  ): Promise<void> {
    const products = data.data;
    subProgress.syncedCount += products.length;
    const lastProduct = products[products.length - 1];
    subProgress.lastId = lastProduct.id;
    subProgress.info = lastProduct.title;
  }

}
