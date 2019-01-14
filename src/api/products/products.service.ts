import { Inject, Injectable } from '@nestjs/common';
import { Products, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { Product, ProductUpdateCreate } from 'shopify-prime/models';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { ProductDocument, IListAllCallbackData } from '../interfaces';
import { Model } from 'mongoose';
import { EventService } from '../../event.service';
import { SyncProgressDocument, SubSyncProgressDocument, ISyncOptions } from '../../interfaces';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';
import * as pRetry from 'p-retry';

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
    @Inject('ProductModelToken')
    private readonly productModel: (shopName: string) => Model<ProductDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    private readonly eventService: EventService,
  ) {
    super(productModel, Products, eventService, syncProgressModel);
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
