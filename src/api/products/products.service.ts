// nest
import { Inject, Injectable } from '@nestjs/common';

// Third party
import * as pRetry from 'p-retry';
import { Products, Options } from 'shopify-prime'; 
import { Product, ProductUpdateCreate } from 'shopify-prime/models';
import { Model } from 'mongoose';

import { IShopifyConnect } from '../../auth/interfaces';
import { ProductDocument, IListAllCallbackData } from '../interfaces';
import { EventService } from '../../event.service';
import { SyncProgressDocument, SubSyncProgressDocument, ISyncOptions } from '../../interfaces';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';
import { ElasticsearchService } from '../../elasticsearch.service';

export interface ProductListOptions extends Options.ProductListOptions {
  sync?: boolean;
  failOnSyncError?: boolean;
}

export interface ProductGetOptions extends Options.FieldOptions {
  sync?: boolean;
}

export interface ProductCountOptions extends Options.ProductCountOptions {}


@Injectable()
export class ProductsService extends ShopifyApiRootCountableService<
Product, // ShopifyObjectType
Products, // ShopifyModelClass
ProductCountOptions, // CountOptions
ProductGetOptions, // GetOptions
ProductListOptions, // ListOptions
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
   * Creates a new product directly in shopify
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
