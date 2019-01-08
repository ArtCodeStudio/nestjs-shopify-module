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
import { IProductSyncProgress, ProductSyncProgressDocument, ISyncProgress, SyncProgressDocument } from '../../sync/sync-progress.schema';
import { ApiService } from '../api.service';
import { Observable, Observer } from 'rxjs';
import { WsResponse } from '@nestjs/websockets';
import * as pRetry from 'p-retry';

export interface ProductListOptions extends Options.ProductListOptions {
  sync?: boolean;
}

export interface ProductCountOptions extends Options.ProductCountOptions {}

export interface ProductSyncOptions {
  resync?: boolean,
  attachToExisting?: boolean,
  cancelExisting?: boolean,
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject('ProductModelToken')
    private readonly productModel: (shopName: string) => Model<ProductDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
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

    return pRetry(() => products.count(options));
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

    const res = await pRetry(() => products.list(options));
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
    .then(async count => {
      const itemsPerPage = 250;
      const pages = Math.ceil(count/itemsPerPage);
      stream.push('[\n');
      for (let i = 0; i < pages; i++) {
        const products = await this.listFromShopify(user,  {...options, page: i+1, limit: itemsPerPage});
        for (let j = 0; j < products.length-1; j++) {
          stream.push(JSON.stringify([products[j]], null, 2).slice(2,-2) + ',');
        }
        stream.push(JSON.stringify([products[products.length-1]], null, 2).slice(2,-2));
        if (i === pages - 1) {
          stream.push('\n]');
        } else {
          stream.push(',');
        }
      }
      stream.push(null);
    }).catch(error => {
      stream.emit('error', error);
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

  async listSyncProgress(user: IShopifyConnect): Promise<ISyncProgress[]> {
    return this.syncProgressModel.find({
      shop: user.shop.myshopify_domain,
      'options.includeProducts': true,
    }).lean();
  }

  async getLastSyncProgress(user: IShopifyConnect): Promise<ISyncProgress | null> {
    return await this.syncProgressModel.findOne(
      {
        shop: user.shop.myshopify_domain,
        'options.includeProducts': true,
      },
      {},
      { sort: { 'createdAt': -1} }
    )
    .lean();
  }


  async startSync(user: IShopifyConnect, options?: ProductSyncOptions, progress?: SyncProgressDocument): Promise<SyncProgressDocument> {
    this.logger.debug(
      `ProductsService.startSync(
        myShopifyDomain=${user.shop.myshopify_domain},
        resync=${options.resync},
        attachToExisting=${options.attachToExisting},
        cancelExisting=${options.cancelExisting},
      )`);

    // Shopify products model
    const products = new Products(user.myshopify_domain, user.accessToken);

    // Get the last sync progress (if it exists)
    const lastProgress: SyncProgressDocument = await this.syncProgressModel.findOne(
      {
        shop: user.shop.myshopify_domain,
      },
      {},
      { sort: { 'createdAt': -1} }
    );

    let isCancelled: boolean = false;

    this.logger.debug('lastProgress:', lastProgress);

    if (!progress) {
      this.logger.debug(`no progress passed as parameter`);
      options = options || {
        // Continue the previous sync by default (don't resync completely).
        resync: false,
        // Don't attach this product sync progress to a running, existing sync progress by default.
        attachToExisting: false,
      };

      if (lastProgress && lastProgress.state === 'running' ) {
        this.logger.debug('check if last progress is still running');
        const lastProgressRunning = await new Promise(resolve => {
          this.eventService.once(`sync-pong:${lastProgress._id}`, () => resolve(true));
          this.eventService.emit(`sync-ping:${lastProgress._id}`);
          setTimeout(() => resolve(false), 5000);
        });
        if (!lastProgressRunning) {
          this.logger.debug('last progress has failed');
          lastProgress.state = 'failure';
          lastProgress.lastError = 'sync timed out';
          await lastProgress.save();
        } else {
          // If the last progress is still running and includes products and all options we need, we just return it, without starting a new one.
          // If the running progress does not include products and the option `attachToExisting` is set, we include the product sync in the running progress.
          // If the options of the running progress and the sync we want to start are incompatible, we throw a `sync in progress` error.
          if (lastProgress.options.includeProducts) {
            if (options.resync && !lastProgress.options.resync) {
              if (options.cancelExisting) {
                this.eventService.emit(`sync-cancel:${lastProgress._id}`);
              } else {
                throw new Error('sync in progress');
              }
            } else {
              // Options are compatible with already running sync. We just re-emit the events and return the running progress.
              this.eventService.emit(`sync`, lastProgress);
              this.eventService.emit(`sync:products`, lastProgress.products);
              this.logger.debug('return last running progress', lastProgress);
              return lastProgress;
            }
          } else if (options.attachToExisting) {
            this.logger.debug('set progress to lastProgress and add products to sync options:', lastProgress);
            progress = lastProgress;
            this.eventService.emit(`sync-attach:${progress._id}`, 'products');
            progress.options.includeProducts = true;
            await progress.save();
          } else {
            if (options.cancelExisting) {
              this.eventService.emit(`sync-cancel:${lastProgress._id}`);
            } else {
              throw new Error('sync in progress');
            }
          }
        }
      }

      if (!progress) {
        // Create a new sync progress
        this.logger.debug(`create new SyncProgress`);
        progress = await this.syncProgressModel.create({
          shop: user.shop.myshopify_domain,
          options: {
            includeProducts: true,
            includeOrders: false,
            includeTransactions: false,
            resync: !!options.resync,
          },
          state: 'running',
          lastError: null,
        });
        this.logger.debug('newly created SyncProgress:', progress);
      }
    }

    this.logger.debug('SyncProgress:', progress);

    // Register an event handler for as long as this sync progress is running, used for checking if the sync is still running
    const pingCallback = () => this.eventService.emit(`sync-pong:${progress._id}`);
    this.eventService.on(`sync-ping:${progress._id}`, pingCallback);

    const attachCallback = (resource: string) => {
      if (resource === 'products') {
        progress.options.includeProducts = true;
      }
    }
    this.eventService.on(`sync-attach:${progress._id}`, attachCallback);

    const cancelCallback = () => {
      isCancelled = true;
    };
    this.eventService.once(`sync-cancel:${progress._id}`, cancelCallback);

    if (isCancelled) {
      this.eventService.off(`sync-ping:${progress._id}`, pingCallback);
      this.eventService.off(`sync-attach:${progress._id}`, attachCallback);
      this.eventService.off(`sync-cancel:${progress._id}`, cancelCallback);
      progress.state = 'canceled';
      progress.save();
      return progress;
    }

    let seedProductsProgress : any = {
      shop: user.shop.myshopify_domain,
      sinceId: 0,
      lastId: null,
      syncedCount: 0,
      shopifyCount: await pRetry(() => products.count()),
      state: 'running',
      error: null,
    }

    if (!options.resync && lastProgress) {
      let lastProductsProgress: ProductSyncProgressDocument | null;
      let lastProgressWithProducts: SyncProgressDocument | null;

      if (lastProgress.products) {
        lastProductsProgress = lastProgress.products;
        lastProgressWithProducts = lastProgress;
      } else {
        const lastProgressWithProductsQuery = {
          shop: user.shop.myshopify_domain,
          'options.includeProducts': true,
        };
        if (isCancelled) {
          this.eventService.off(`sync-ping:${progress._id}`, pingCallback);
          this.eventService.off(`sync-attach:${progress._id}`, attachCallback);
          this.eventService.off(`sync-cancel:${progress._id}`, cancelCallback);
          progress.state = 'canceled';
          progress.save();
          return progress;
        }
        lastProgressWithProducts = await this.syncProgressModel.findOne(
          lastProgressWithProductsQuery,
          {},
          { sort: { 'createdAt': -1} }
        );
        lastProductsProgress = lastProgressWithProducts && lastProgressWithProducts.products;
      }

      if (lastProductsProgress) {
        seedProductsProgress.sinceId = lastProductsProgress.lastId;
        seedProductsProgress.lastId = lastProductsProgress.lastId;
        seedProductsProgress.syncedCount = lastProductsProgress.syncedCount;
        seedProductsProgress.continuedFromPrevious = lastProgressWithProducts._id;
      }
    }

    this.logger.debug('Seed products progress:', seedProductsProgress);

    progress.products = seedProductsProgress;

    this.logger.debug('Seeded products progress:', progress.products);

    // The actual sync action:

    const remainingCount = progress.products.shopifyCount - progress.products.syncedCount;
    this.logger.debug('remaining count:', remainingCount);
    const itemsPerPage = 250;
    const pages = Math.ceil(remainingCount/itemsPerPage);
    this.logger.debug('pages:', pages);
    let countDown = pages;

    // We want to do this all in a separate detached promise but return the progress immediately:
    Promise.resolve().then(async _ => {
      try {
        for (let i=0; i<pages; i++) {
          if (isCancelled) {
            throw new Error('cancelled');
          }
          const objects = await this.listFromShopify(
            user,
            {
              sync: true,
              since_id: progress.products.sinceId,
              page: i+1,
              limit: itemsPerPage,
            }
          );
          countDown--;
          this.logger.debug(` ${i}|${countDown} / ${pages}`);
          progress.products.syncedCount += objects.length;
          progress.products.lastId = objects[objects.length-1].id;
          await progress.save();
        }
        progress.products.state = 'success';
        await progress.save();
        return progress;
      } catch (error) {
        progress.products.state = 'failed';
        progress.products.error = error.message;
        progress.lastError = `products:${error.message}`;
        this.logger.error('product sync error:', error);
      }
      if (!progress.options.includeOrders) {
        progress.state = progress.products.state;
      } else if (progress.orders && progress.orders.state !== 'running') {
        if (progress.products.state === 'success' && progress.orders.state === 'success') {
          progress.state = 'success';
        } else {
          progress.state = 'failed';
        }
      }
      this.eventService.off(`sync-ping:${progress._id}`, pingCallback);
      this.eventService.off(`sync-attach:${progress._id}`, attachCallback);
      this.eventService.off(`sync-cancel:${progress._id}`, cancelCallback);
      await progress.save();
    });

    return progress;
  }
}
