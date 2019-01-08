import { Inject, Injectable } from '@nestjs/common';
import { Products, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { Product, ProductUpdateCreate } from 'shopify-prime/models';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { ProductDocument } from '../interfaces/product.schema';
import { Model, Types } from 'mongoose';
import { getDiff } from '../../helpers/diff';
import { Readable } from 'stream';
import * as PQueue from 'p-queue';
import { DebugService } from '../../debug.service';
import { EventService } from '../../event.service';
import { IProductSyncProgress, ProductSyncProgressDocument } from '../../sync/sync-progress.schema';
import { ApiService } from '../api.service';
import { Observable, Observer } from 'rxjs';
import { WsResponse } from '@nestjs/websockets';

export interface ProductListOptions extends Options.ProductListOptions {
  sync?: boolean;
}

export interface ProductCountOptions extends Options.ProductCountOptions {}

export interface ProductSyncOptions {
  resync: boolean,
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject('ProductModelToken') private readonly productModel: (shopName: string) => Model<ProductDocument>,
    @Inject('ProductSyncProgressModelToken') private readonly productSyncProgressModel: (shopName: string) => Model<ProductSyncProgressDocument>,
    private readonly eventService: EventService,
  ) {}

  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Retrieves a single product directly from the shopify API
   * @param user 
   * @param id 
   * @param sync 
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  public async getFromShopify(user: IShopifyConnect, id: number, sync?: boolean) {
    const products = new Products(user.myshopify_domain, user.accessToken);
    const res = await products.get(id);
    if (sync) {
      await this.updateOrCreateInDb(user, res);
    }
    return res;
  }

  /**
   * Retrieves a single product from the app's own database.
   * @param user 
   * @param id 
   * @param sync 
   */
  public async getFromDb(user: IShopifyConnect, id: number) {
    return this.productModel(user.shop.myshopify_domain).find({id});
  }

  /**
   * Retrieves a count of products directly from shopify.
   * @param user 
   * @param options 
   * @see https://help.shopify.com/en/api/reference/products/product#count
   */
  public async countFromShopify(user: IShopifyConnect, options?: Options.ProductCountOptions): Promise<number> {
    const products = new Products(user.myshopify_domain, user.accessToken);

    // Delete undefined options
    options = ApiService.deleteUndefinedProperties(options);

    return products.count(options);
  }

  /**
   * Retrieves a count of products from the app's own database.
   * @param user 
   * @param options 
   */
  public async countFromDb(user: IShopifyConnect, options?: Options.ProductCountOptions): Promise<number> {
    return this.productModel(user.shop.myshopify_domain).count({});
  }

  /**
   * Retrieves a list of products directly from shopify.
   * @param user 
   * @param options 
   */
  public async listFromShopify(user: IShopifyConnect, options?: ProductListOptions): Promise<Product[]> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    let sync = options && options.sync;
    if (sync) {
      delete options.sync;
    }

    // Delete undefined options
    options = ApiService.deleteUndefinedProperties(options);

    const res = await products.list(options);
    if (sync) {
      await this.updateOrCreateManyInDb(user, res);
    }
    return res;
  }

  /**
   * Retrieves a list of products from the app's own database.
   * @param user 
   */
  public async listFromDb(user: IShopifyConnect): Promise<Product[]> {
    return this.productModel(user.shop.myshopify_domain).find({}).select('-_id -__v').lean();
  }

  /**
   * Internal method used for tests to compare the shopify products with the products in the app's own database
   * @param user 
   */
  public async diffSynced(user: IShopifyConnect): Promise<any> {
    const fromDb = await this.listFromDb(user);
    const fromShopify = await this.listAllFromShopify(user);
    let dbObj;
    return fromShopify.map(obj => (dbObj = fromDb.find(x => x.id === obj.id)) && {[obj.id]: getDiff(obj, dbObj).filter(x=>x.operation!=='update' && !x.path.endsWith('._id'))})
    .reduce((a,c)=>({...a, ...c}), {})
  }

  /**
   * Gets a list of all of the shop's products directly from the shopify API
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(user: IShopifyConnect, options?: ProductListOptions): Promise<Product[]> {
    const products = new Products(user.myshopify_domain, user.accessToken);

    // Delete undefined options
    options = ApiService.deleteUndefinedProperties(options);

    return products.count(options)
    .then(async (count) => {
      const itemsPerPage = 250;
      const pages = Math.ceil(count/itemsPerPage);
      let q = new PQueue({ concurrency: 1});
      const productListPromises = Array(pages).fill(0).map((x, i) => {
        return q.add(async () => {
          return this.listFromShopify(user, {...options, page: i+1, limit: itemsPerPage})
        })
        .then((products: Product[]) => {
          return products;
        });
      });
      return Promise.all(productListPromises);
    })
    .then(results => {
      return [].concat.apply([], results);
    })
  }

  /**
   * Gets a list of all of the shop's products directly from the shopify API as a stream
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyStream(user: IShopifyConnect, options?: ProductListOptions): Readable {
    const products = new Products(user.myshopify_domain, user.accessToken);
    const stream = new Readable({objectMode: true, read: s=>s});

    // Delete undefined options
    options = ApiService.deleteUndefinedProperties(options);

    products.count(options)
    .then(async (count) => {
      const itemsPerPage = 250;
      const pages = Math.ceil(count/itemsPerPage);
      let countDown = pages;
      let q = new PQueue({ concurrency: 1});
      const productListPromises = Array(pages).fill(0).map((x, i) => {
        return q.add(async () => {
          return this.listFromShopify(user, {...options, page: i+1, limit: itemsPerPage})
          .then((products) => {
            countDown--;
            this.logger.debug(`listAll ${i}|${countDown} / ${pages}`);
            products.forEach((product, i) => {
              stream.push(JSON.stringify([product], null, 2).slice(2,-2) + (countDown > 0 || (i!==products.length-1) ? ',': '\n]'));
            });
          });
        });
      });

      return Promise.all(productListPromises)
      .then((_) => {
        return stream.push(null)
      })
      .catch((error) => {

      })
    });

    return stream;
  }

  /**
   * Gets a list of all of the shop's products directly from the shopify API as a Observable
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyObservable(user: IShopifyConnect, eventName: string, options?: ProductListOptions): Observable<WsResponse<Product>> {
    const products = new Products(user.myshopify_domain, user.accessToken);

    // Delete undefined options
    options = ApiService.deleteUndefinedProperties(options);
    return Observable.create((observer: Observer<WsResponse<Product>>) => {

      products.count(options)
      .then(async (count) => {
        const itemsPerPage = 250;
        const pages = Math.ceil(count/itemsPerPage);
        let countDown = pages;
        let q = new PQueue({ concurrency: 1});
        const productListPromises = Array(pages).fill(0).map(async (x, i) => {
          return q.add(async () => {
            return this.listFromShopify(user, {...options, page: i+1, limit: itemsPerPage})
            .then((products: Product[]) => {
              countDown--;
              this.logger.debug(`listAll ${i}|${countDown} / ${pages}`);
              products.forEach((product, i) => {
                observer.next({
                  event: eventName,
                  data: product,
                });
              });
              return null;
            });
          })
        });

        return Promise.all(productListPromises)
        .then((_) => {
          observer.complete();
        });

      });
    });
  }

  /**
   * Creates a new product directly in shopify
   * @param user 
   * @param product 
   */
  public async createInShopify(user: IShopifyConnect, product: ProductUpdateCreate): Promise<Product> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return products.create(product);
  }

  /**
   * Updates a product and its variants and images directly in shopify.
   * @param user 
   * @param id 
   * @param product 
   */
  public async updateInShopify(user: IShopifyConnect, id: number, product: ProductUpdateCreate): Promise<Product> {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return products.update(id, product);
  }

  /**
   * Deletes a product directly in shopify.
   * @param user 
   * @param id 
   * @param product 
   */
  public async deleteInShopify(user: IShopifyConnect, id: number) {
    const products = new Products(user.myshopify_domain, user.accessToken);
    return products.delete(id);
  }

  /**
   * Internal method to update several products in the app database.
   * @param user 
   * @param products 
   */
  protected async updateOrCreateManyInDb(user: IShopifyConnect, products: Product[]) {
    const model = this.productModel(user.shop.myshopify_domain);
    return products.map(async (product: Product) => await this.updateOrCreateInDb(user, product));
  }

  /**
   * Internal method to update or create a single product in the app database.
   * @param user 
   * @param product 
   */
  protected async updateOrCreateInDb(user: IShopifyConnect, product: Product) {
    const model = this.productModel(user.shop.myshopify_domain);
    return model.findOneAndUpdate({id: product.id}, product, {upsert: true});
  }

  async listSyncProgress(user: IShopifyConnect): Promise<IProductSyncProgress[]> {
    // Mongoose order sync progress model
    const productSyncProgressModel = this.productSyncProgressModel(user.shop.myshopify_domain);
    return productSyncProgressModel.find().lean();
  }

  async getLastSyncProgress(user: IShopifyConnect): Promise<IProductSyncProgress | null> {
    // Mongoose order sync progress model
    const productSyncProgressModel = this.productSyncProgressModel(user.shop.myshopify_domain);
    return await productSyncProgressModel.findOne(
      {},
      {},
      { sort: { 'createdAt': -1} }
    )
    .lean();
  }

  async startSync(user: IShopifyConnect, options?: ProductSyncOptions) {
    // Continue the previous sync by default (don't resync completely)
    options = options || { resync: false };
    this.logger.debug(`ProductsService.startSync(myShopifyDomain=${user.shop.myshopify_domain}, resync=${options.resync})`);
    // Shopify products model
    const products = new Products(user.myshopify_domain, user.accessToken);
    // Mongoose product sync progress model
    const productSyncProgressModel = this.productSyncProgressModel(user.shop.myshopify_domain);

    const now = new Date();

    // Get the last sync progress (if it exists)
    const lastProgress: ProductSyncProgressDocument = await productSyncProgressModel.findOne(
      {},
      {},
      { sort: { 'createdAt': -1} }
    );

    if (lastProgress && lastProgress.state === 'running') {
      const millisecondsSinceLastUpdate = now.valueOf() - lastProgress.updatedAt.valueOf();
      const fiveMinutes = 5 * 60 * 1000;
      // If last progress was not updated in the last 5 minutes, consider it as failed
      if (millisecondsSinceLastUpdate > fiveMinutes) {
        lastProgress.state = 'failure';
        lastProgress.error = 'sync timed out';
        lastProgress.updatedAt = now;
        lastProgress.save();
        this.eventService.emit(`sync:product`, lastProgress);
      } else {
        this.eventService.emit(`sync:product`, lastProgress);
        return lastProgress;
      }
    }
    const progress: ProductSyncProgressDocument = await productSyncProgressModel.create({
      createdAt: now,
      updatedAt: now,
      sinceId: !options.resync && lastProgress && lastProgress.lastId || 0,
      lastId: !options.resync && lastProgress && lastProgress.lastId || null,
      syncedCount: !options.resync && lastProgress && lastProgress.syncedCount || 0,
      shopifyCount: await products.count(),
      state: 'running',
      error: null,
    });
    this.eventService.emit(`sync:product`, progress);

    const remainingCount = progress.shopifyCount - progress.syncedCount;
    const itemsPerPage = 250;
    const pages = Math.ceil(remainingCount/itemsPerPage);
    let countDown = pages;
    let q = new PQueue({ concurrency: 1});
    Promise.all(Array(pages).fill(0).map(
      (x, i) => q.add(() => this.listFromShopify(
          user,
          {
            sync: true,
            since_id: progress.sinceId,
            page: i+1,
            limit: itemsPerPage
          }
        )
        .then(objects => {
          countDown--;
          this.logger.debug(` ${i}|${countDown} / ${pages}`);
          progress.syncedCount += objects.length;
          progress.lastId = objects[objects.length-1].id;
          progress.updatedAt = new Date();
          progress.save();
          this.eventService.emit(`sync:product`, progress);
        })
      )
    ))
    .then( _ => {
      progress.state = 'success';
      progress.updatedAt = new Date();
      this.eventService.emit(`sync:product`, progress);
    });
    return progress;
  }
}
