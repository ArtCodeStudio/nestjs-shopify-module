import { Inject, Injectable } from '@nestjs/common';
import { Products, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Product } from 'shopify-prime/models';
import { ProductDocument } from '../interfaces/product.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('ProductModelToken')
    private readonly productModel: Model<ProductDocument>,
  ) {}

  public async count(user: IShopifyConnect, options?: Options.ProductListOptions): Promise<number> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return await products.count(options);
  }
  public async list(user: IShopifyConnect, options?: Options.ProductListOptions): Promise<Product[]> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return await products.list(options);
  }
  /**
   * Gets a list of all of the shop's products.
   * @param options Options for filtering the results.
   */
  public async listAll(user: IShopifyConnect, options?: Options.ProductListOptions): Promise<Product[]> {
    const products = new Products(user.myshopify_domain, user.accessToken)
    const count = await products.count(options);
    const itemsPerPage = 250;
    const pages = Math.ceil(count/itemsPerPage);
    return await Promise.all(Array(pages).fill(0).map((x, i) => products.list({...options, page: i+1, limit: itemsPerPage})))
    .then(results => {
      return [].concat.apply([], results);
    })
  }
}
