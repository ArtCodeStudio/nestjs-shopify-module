// nest
import { Inject, Injectable } from '@nestjs/common';

// Third party
import { shopifyRetry } from '../../../helpers';

import { IShopifyConnect } from '../../../auth/interfaces';
import { ProductVariants } from 'shopify-admin-api';
import { Interfaces } from 'shopify-admin-api';
import { Model } from 'mongoose';
import {
  ProductVariantDocument,
  IShopifySyncProductVariantGetOptions,
  IShopifySyncProductVariantListOptions,
} from '../../interfaces';

import { EventService } from '../../../event.service';
import { Resource } from '../../../interfaces';

@Injectable()
export class ProductVariantsService {

  resourceName: Resource = 'products';
  subResourceNames: Resource[] = [];

  constructor(
    @Inject('ProductVariantModelToken') protected readonly productVariantModel: (shopName: string) => Model<ProductVariantDocument>,
    protected readonly eventService: EventService,
  ) {
    
  }

 /**
   * Retrieves a single `ShopifyObjectType[]` directly from the shopify API
   * @param user
   * @param id
   * @param sync
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  public async getFromShopify(user: IShopifyConnect, parentId: number, id: number, options?: IShopifySyncProductVariantGetOptions): Promise<Partial<Interfaces.ProductVariant> | null> {
    const shopifyModel = new ProductVariants(user.myshopify_domain, user.accessToken);
    delete options.syncToDb;
    return shopifyRetry(() => {
      return shopifyModel.get(parentId, options);
    });
  }

  /**
   * Retrieves a list of `ShopifyObjectType[]` directly from shopify.
   * @param user
   * @param options
   */
  public async listFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options?: IShopifySyncProductVariantListOptions): Promise<Partial<Interfaces.ProductVariant>[]> {
    const shopifyModel = new ProductVariants(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    options = Object.assign({}, options);
    delete options.syncToDb;
    delete options.failOnSyncError;
    delete options.cancelSignal; // TODO?
    return shopifyRetry(() => {
      return shopifyModel.list(parentId, options);
    });

  }

  /**
   * Retrieves a list of product variants from the app's mongodb database.
   * @param user
   */
  public async listFromDb(/*user: IShopifyConnect, options: IAppProductVariantListOptions = {}*/): Promise<Interfaces.ProductVariant[]> {
    return null; // super.listFromDb(user, query, basicOptions);
  }

  /**
   * Creates a new product variant directly in shopify.
   * @param user
   * @param productId
   */
  public async createInShopify(user: IShopifyConnect, productId: number, product: Interfaces.ProductVariantCreate): Promise<Interfaces.ProductVariant> {
    const productVariants = new ProductVariants(user.myshopify_domain, user.accessToken);
    return shopifyRetry(() => productVariants.create(productId, product));
  }

  /**
   * Updates a product variant directly in shopify.
   * @param user
   * @param id
   * @param product
   */
  public async updateInShopify(user: IShopifyConnect, id: number, product: Interfaces.ProductVariantUpdate): Promise<Interfaces.ProductVariant> {
    const productVariants = new ProductVariants(user.myshopify_domain, user.accessToken);
    return shopifyRetry(() => productVariants.update(id, product));
  }

  /**
   * Deletes a product variant directly in shopify.
   * @param user
   * @param productId
   * @param variantId
   */
  public async deleteInShopify(user: IShopifyConnect, productId: number, variantId: number) {
    const productVariants = new ProductVariants(user.myshopify_domain, user.accessToken);
    return shopifyRetry(() => productVariants.delete(productId, variantId));
  }


  public async countFromShopify(shopifyConnect: IShopifyConnect, productId: number): Promise<number> {
    const shopifyModel = new ProductVariants(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    return shopifyRetry(() => {
      return shopifyModel.count(productId);
    });
  }

}
