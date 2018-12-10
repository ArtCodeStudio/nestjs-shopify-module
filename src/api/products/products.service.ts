import { Inject, Injectable } from '@nestjs/common';
import { Products, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Product } from 'shopify-prime/models';
import { ProductDocument } from '../interfaces/product.schema';
import { Model, Types } from 'mongoose';

export interface ProductListOptions extends Options.ProductListOptions {
  sync?: boolean;
}

export interface ProductCountOptions extends Options.ProductCountOptions {
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject('ProductModelToken')
    private readonly productModel: Model<ProductDocument>,
  ) {}

  public async get(user: IShopifyConnect, id: number, sync: boolean = true) {
    const products = new Products(user.myshopify_domain, user.accessToken);
    const product = await products.get(id);
    if (product && sync) {
      //const dbProduct = new this.productModel(product);
      //console.log('saving product', await this.productModel.update({id: id}, dbProduct, {upsert: true}).exec());
      console.log('saving product', await this.productModel.findOneAndUpdate({id: product.id}, product, {upsert: true}));
    }
    return product;
  }

  public async count(user: IShopifyConnect, options?: Options.ProductCountOptions): Promise<number> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return await products.count(options);
  }
  public async list(user: IShopifyConnect, options?: ProductListOptions): Promise<Product[]> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    const data = await products.list(options);
    if (options && options.sync) {
      // TODO: how to use bulk methods?
      data.forEach(async product => {
        console.log('saving product', await this.productModel.findOneAndUpdate({id: product.id}, product, {upsert: true}));
      });
    }
    return data;
  }
  /**
   * Gets a list of all of the shop's products.
   * @param options Options for filtering the results.
   */
  public async listAll(user: IShopifyConnect, options?: ProductListOptions): Promise<Product[]> {
    const products = new Products(user.myshopify_domain, user.accessToken)
    const count = await products.count(options);
    const itemsPerPage = 250;
    const pages = Math.ceil(count/itemsPerPage);
    return await Promise.all(
      Array(pages).fill(0).map(
        (x, i) => this.list(user, {...options, page: i+1, limit: itemsPerPage})
      )
    )
    .then(results => {
      return [].concat.apply([], results);
    })
  }

  public async sync(user: IShopifyConnect) {

  }
}
