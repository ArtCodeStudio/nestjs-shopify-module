// nest
import { Inject, Injectable } from '@nestjs/common';

// Third party
import { shopifyRetry } from '../../helpers';

import { IShopifyConnect } from '../../auth/interfaces';
import { Checkouts } from 'shopify-admin-api';
import { Interfaces } from 'shopify-admin-api';
import { Model } from 'mongoose';
import {
  CheckoutDocument,
  IShopifySyncCheckoutGetOptions,
  IShopifySyncCheckoutListOptions,
} from '../interfaces';

import { EventService } from '../../event.service';
import { Resource } from '../../interfaces';

@Injectable()
export class CheckoutsService {

  resourceName: Resource = 'products';
  subResourceNames: Resource[] = [];

  constructor(
    @Inject('CheckoutModelToken') protected readonly checkoutModel: (shopName: string) => Model<CheckoutDocument>,
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
  public async getFromShopify(user: IShopifyConnect, checkoutToken: string, options?: IShopifySyncCheckoutGetOptions): Promise<Partial<Interfaces.Checkout> | null> {
    const shopifyCheckoutModel = new Checkouts(user.myshopify_domain, user.accessToken);
    delete options.syncToDb;
    return shopifyRetry(() => {
      return shopifyCheckoutModel.get(checkoutToken, options);
    });
  }

  /**
   * Retrieves a list of `ShopifyObjectType[]` directly from shopify.
   * @param user
   * @param options
   */
  public async listFromShopify(shopifyConnect: IShopifyConnect, options?: IShopifySyncCheckoutListOptions): Promise<Partial<Interfaces.Checkout>[]> {
    const shopifyCheckoutModel = new Checkouts(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    options = Object.assign({}, options);
    delete options.syncToDb;
    delete options.failOnSyncError;
    delete options.cancelSignal; // TODO?
    return shopifyRetry(() => {
      return shopifyCheckoutModel.list(options);
    });

  }

  /**
   * Retrieves a list of product variants from the app's mongodb database.
   * @param user
   */
  public async listFromDb(/*user: IShopifyConnect, options: IAppCheckoutListOptions = {}*/): Promise<Interfaces.Checkout[]> {
    return null; // super.listFromDb(user, query, basicOptions);
  }

  /**
   * Creates a new product variant directly in shopify.
   * @param user
   * @param productId
   */
  public async createInShopify(user: IShopifyConnect, checkout: Interfaces.Checkout): Promise<Interfaces.Checkout> {
    const shopifyCheckoutModel = new Checkouts(user.myshopify_domain, user.accessToken);
    return shopifyRetry(() => shopifyCheckoutModel.create(checkout));
  }

  /**
   * Updates a product variant directly in shopify.
   * @param user
   * @param id
   * @param product
   */
  public async updateInShopify(user: IShopifyConnect, checkoutToken: string, checkout: Interfaces.CheckoutUpdate): Promise<Interfaces.Checkout> {
    const shopifyCheckoutModel = new Checkouts(user.myshopify_domain, user.accessToken);
    return shopifyRetry(() => shopifyCheckoutModel.update(checkoutToken, checkout));
  }
}
