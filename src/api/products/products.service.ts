import { Inject, Injectable } from '@nestjs/common';
import { Products, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Product } from 'shopify-prime/models';
import { ProductDocument } from '../interfaces/product.schema';
import { Model, Types } from 'mongoose';
import { getDiff } from '../../helpers/diff';
import { Readable } from 'stream';
import { PQueue } from 'p-queue';
import { DebugService } from '../../debug.service';

export interface ProductListOptions extends Options.ProductListOptions {
  sync?: boolean;
}

export interface ProductCountOptions extends Options.ProductCountOptions {
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject('ProductModelToken')
    private readonly productModel: (shopName: string) => Model<ProductDocument>,
  ) {}

  logger = new DebugService(`shopify:${this.constructor.name}`);

  public async getFromShopify(user: IShopifyConnect, id: number, sync?: boolean) {
    const products = new Products(user.myshopify_domain, user.accessToken);
    const res = await products.get(id);
    if (sync) {
      await this.saveOne(user, res);
    }
    return res;
  }

  public async getFromDb(user: IShopifyConnect, id: number) {
    return await this.productModel(user.shop.myshopify_domain).find({id});
  }

  public async countFromShopify(user: IShopifyConnect, options?: Options.ProductCountOptions): Promise<number> {
    const products = new Products(user.myshopify_domain, user.accessToken);

    // Delete undefined options
    if (options) {
      for (const key in options) {
        if (options.hasOwnProperty(key)) {
          if (typeof(options[key]) === 'undefined') {
            delete options[key];
          }
        }
      }
    }

    return await products.count(options);
  }
  public async countFromDb(user: IShopifyConnect, options?: Options.ProductCountOptions): Promise<number> {
    return await this.productModel(user.shop.myshopify_domain).count({});
  }

  public async listFromShopify(user: IShopifyConnect, options?: ProductListOptions): Promise<Product[]> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    let sync = options && options.sync;
    if (sync) {
      delete options.sync;
    }

    // Delete undefined options
    if (options) {
      for (const key in options) {
        if (options.hasOwnProperty(key)) {
          if (typeof(options[key]) === 'undefined') {
            delete options[key];
          }
        }
      }
    }

    const res = await products.list(options);
    if (sync) {
      await this.saveMany(user, res);
    }
    return res;
  }

  public async saveMany(user: IShopifyConnect, products: Product[]) {
    const model = this.productModel(user.shop.myshopify_domain);
    return products.map(async (product: Product) => await model.findOneAndUpdate({id: product.id}, product, {upsert: true}));
  }

  public async saveOne(user: IShopifyConnect, product: Product) {
    const model = this.productModel(user.shop.myshopify_domain);
    return await model.findOneAndUpdate({id: product.id}, product);
  }

  public async listFromDb(user: IShopifyConnect): Promise<Product[]> {
    return await this.productModel(user.shop.myshopify_domain).find({}).select('-_id -__v').lean();
  }

  public async diffSynced(user: IShopifyConnect): Promise<any> {
    const fromDb = await this.listFromDb(user);
    const fromShopify = await this.listAllFromShopify(user);
    let dbObj;
    return fromShopify.map(obj => (dbObj = fromDb.find(x => x.id === obj.id)) && {[obj.id]: getDiff(obj, dbObj).filter(x=>x.operation!=='update' && !x.path.endsWith('._id'))})
    .reduce((a,c)=>({...a, ...c}), {})
  }

  /**
   * Gets a list of all of the shop's products.
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(user: IShopifyConnect, options?: ProductListOptions): Promise<Product[]> {
    const products = new Products(user.myshopify_domain, user.accessToken);

    // Delete undefined options
    if (options) {
      for (const key in options) {
        if (options.hasOwnProperty(key)) {
          if (typeof(options[key]) === 'undefined') {
            delete options[key];
          }
        }
      }
    }

    const count = await products.count(options);
    const itemsPerPage = 250;
    const pages = Math.ceil(count/itemsPerPage);
    return await Promise.all(
      Array(pages).fill(0).map(
        (x, i) => this.listFromShopify(user, {...options, page: i+1, limit: itemsPerPage})
      )
    )
    .then(results => {
      return [].concat.apply([], results);
    })
  }

  /**
   * Gets a list of all of the shop's orders.
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyStream(user: IShopifyConnect, options?: ProductListOptions): Readable {
    const products = new Products(user.myshopify_domain, user.accessToken);
    const stream = new Readable({objectMode: true, read: s=>s});

    // Delete undefined options
    if (options) {
      for (const key in options) {
        if (options.hasOwnProperty(key)) {
          if (typeof(options[key]) === 'undefined') {
            delete options[key];
          }
        }
      }
    }

    products.count(options).then(count => {
      const itemsPerPage = 250;
      const pages = Math.ceil(count/itemsPerPage);
      let countDown = pages;
      let q = new PQueue({ concurrency: 1});
      stream.push('[\n');
      Promise.all(Array(pages).fill(0).map(
        (x, i) => q.add(() => this.listFromShopify(user, {...options, page: i+1, limit: itemsPerPage})
          .then(objects => {
            countDown--;
            this.logger.debug(`listAll ${i}|${countDown} / ${pages}`);
            objects.forEach((obj, i) => {
              stream.push(JSON.stringify([obj], null, 2).slice(2,-2) + (countDown > 0 || (i!==objects.length-1) ? ',': '\n]'));
            });
          })
        )
      ))
      .then(_ => stream.push(null));
    });
    return stream;
  }
}
