// nest
import { Inject, Injectable } from '@nestjs/common';

// Third party
import * as pRetry from 'p-retry';
import { Products, Options } from 'shopify-prime'; 
import { Product, ProductUpdateCreate } from 'shopify-prime/models';
import { Model } from 'mongoose';
import { GenericParams as ESGenericParams } from 'elasticsearch';


import { IShopifyConnect } from '../../auth/interfaces';
import {
  ProductDocument,
  IListAllCallbackData,
  ShopifySyncProductCountOptions,
  ShopifySyncProductGetOptions,
  ShopifySyncProductListOptions,
  AppProductCountOptions,
  AppProductGetOptions,
  AppProductListOptions,
} from '../interfaces';
import { EventService } from '../../event.service';
import { SyncProgressDocument, SubSyncProgressDocument, ISyncOptions } from '../../interfaces';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';
import { ElasticsearchService } from '../../elasticsearch.service';

@Injectable()
export class ProductsService extends ShopifyApiRootCountableService<
Product, // ShopifyObjectType
Products, // ShopifyModelClass
ShopifySyncProductCountOptions, // CountOptions
ShopifySyncProductGetOptions, // GetOptions
ShopifySyncProductListOptions, // ListOptions
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
  public async listFromDb(user: IShopifyConnect, conditions = {}): Promise<Product[]> {
    return super.listFromDb(user, conditions);
  }

  /**
   * Retrieves a list of products from elasticsearch.
   * @param user 
   * @param body see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html and https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
   */
  public async listFromSearch(user: IShopifyConnect, options: AppProductListOptions): Promise<Product[]> {
    
    
    const query = {
      match_all: {},
    };

    // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-source-filtering.html
    let _source: boolean | string[] = true;

    // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-from-size.html
    let size = 250;

    // Convert fields to ES fields
    if (options.fields) {
      _source = options.fields.split(',');
    }

    // Convert limit to ES limit
    if (options.limit) {
      size = options.limit || 250;
      if (size > 250 || size <= 0) {
        size = 250
      }
    }

    const body = {_source, size, query};
    
    return super.listFromSearch(user, body);
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
    options: ISyncOptions,
    data: IListAllCallbackData<Product>
  ): Promise<void> {
    const products = data.data;
    subProgress.syncedCount += products.length;
    const lastProduct = products[products.length-1];
    subProgress.lastId = lastProduct.id;
    subProgress.info = lastProduct.title;
  }

}
