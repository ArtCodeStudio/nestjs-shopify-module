import { Inject, Injectable } from '@nestjs/common';
import { Products, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { Product, ProductUpdateCreate } from 'shopify-prime/models';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { ProductDocument } from '../interfaces/mongoose/product.schema';
import { Model } from 'mongoose';
import { EventService } from '../../event.service';
import { ProductSyncProgressDocument, ISyncProgress, SyncProgressDocument } from '../../interfaces';
import { ShopifyApiRootCountService } from '../api.service';
import * as pRetry from 'p-retry';

export interface ProductListOptions extends Options.ProductListOptions {
  sync?: boolean;
  failOnSyncError?: boolean;
}

export interface ProductGetOptions extends Options.FieldOptions {
  sync?: boolean;
}

export interface ProductCountOptions extends Options.ProductCountOptions {}

export interface ProductSyncOptions {
  resync?: boolean,
  attachToExisting?: boolean,
  cancelExisting?: boolean,
}

@Injectable()
export class ProductsService extends ShopifyApiRootCountService<
Product, // ShopifyObjectType
Products, // ShopifyModelClass
ProductCountOptions, // CountOptions
ProductGetOptions, // GetOptions
ProductListOptions, // ListOptions
ProductDocument // DatabaseDocumentType
> {
  constructor(
    @Inject('ProductModelToken')
    private readonly productModel: (shopName: string) => Model<ProductDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    private readonly eventService: EventService,
  ) {
    super(productModel, Products);
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

  /**
   * 
   * @param user 
   * @param options 
   * @param progress 
   * 
   * @event sync-pong:[shop]:[progressId] ()
   * @event sync-cancel:[shop]:[lastProgressId] ()
   * @event sync (lastProgress)
   * @event sync:products (lastProgressProducts)
   * @event sync-attach:[shop]:[progressId] (type = 'products')
   * @event sync-cancelled:[shop]:[progressId] ()
   */
  async startSync(user: IShopifyConnect, options?: ProductSyncOptions, progress?: SyncProgressDocument, lastProgress?: SyncProgressDocument): Promise<SyncProgressDocument> {
    this.logger.debug(
      `ProductsService.startSync(
        myShopifyDomain=${user.shop.myshopify_domain},
        resync=${options.resync},
        attachToExisting=${options.attachToExisting},
        cancelExisting=${options.cancelExisting},
      )`
    );

    const shop: string = user.shop.myshopify_domain;

    let isCancelled: boolean = false;

    if (!progress) {
      this.logger.debug(`no progress passed as parameter`);
      options = options || {
        // Continue the previous sync by default (don't resync completely).
        resync: false,
        // Don't attach this product sync progress to a running, existing sync progress by default.
        attachToExisting: false,
      };

      if (lastProgress && lastProgress.state === 'running' ) {
        let tooLate = false;
        this.logger.debug(`check if last progress ${lastProgress.id} is still running`);
        const lastProgressRunning = await new Promise(resolve => {
          let time: number;
          this.eventService.once(`sync-${shop}:${lastProgress._id}`, () => {
            this.logger.debug(`received pong sync-${shop}:${lastProgress._id}:`, tooLate?'too late':'just in time', Date.now()-time);
            resolve(true);
          });
          time = Date.now();
          setTimeout(() => resolve(false), 7777);
        });
        tooLate=true;
        if (!lastProgressRunning) {
          this.logger.debug('last progress has failed');
          lastProgress.state = 'failed';
          lastProgress.lastError = 'sync timed out';
          await lastProgress.save();
          // Just to make sure, we send a cancel event to the progress. Maybe he was just very busy.
          this.eventService.emit(`sync-cancel:${shop}:${lastProgress._id}`);
        } else {
          // If the last progress is still running and includes products and all options we need, we just return it, without starting a new one.
          // If the running progress does not include products and the option `attachToExisting` is set, we include the product sync in the running progress.
          // If the options of the running progress and the sync we want to start are incompatible, we throw a `sync in progress` error.
          if (lastProgress.options.includeProducts) {
            if (options.resync && !lastProgress.options.resync) {
              if (options.cancelExisting) {
                this.eventService.emit(`sync-cancel:${shop}:${lastProgress._id}`);
              } else {
                throw new Error('sync in progress');
              }
            } else {
              // Options are compatible with already running sync. We just re-emit the events and return the running progress.
              this.eventService.emit(`sync`, lastProgress); // Why global?
              this.eventService.emit(`sync:products`, lastProgress.products);
              this.logger.debug('return last running progress', lastProgress);
              return lastProgress;
            }
          } else if (options.attachToExisting) {
            this.logger.debug('set progress to lastProgress and add products to sync options:', lastProgress);
            progress = lastProgress;
            this.eventService.emit(`sync-attach:${shop}:${progress._id}`, 'products');
            progress.options.includeProducts = true;
            await progress.save();
          } else {
            if (options.cancelExisting) {
              this.eventService.emit(`sync-cancel:${shop}:${lastProgress._id}`);
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
    } else {
      this.logger.debug('progress passed as parameter:', progress);
      this.logger.debug('lastProgress:', lastProgress);
    }

    this.logger.debug('SyncProgress:', progress);

    const attachCallback = (resource: string) => {
      if (resource === 'products') {
        progress.options.includeProducts = true;
      }
    }
    this.eventService.on(`sync-attach:${shop}:${progress._id}`, attachCallback);

    const cancelCallback = () => {
      isCancelled = true;
      this.eventService.emit(`sync-cancelled:${shop}:${progress._id}`);
    };
    this.eventService.once(`sync-cancel:${shop}:${progress._id}`, cancelCallback);

    if (isCancelled) {
      this.eventService.off(`sync-attach:${shop}:${progress._id}`, attachCallback);
      this.eventService.off(`sync-cancel:${shop}:${progress._id}`, cancelCallback);
      this.logger.debug(`product sync ${progress._id}:${progress.products._id} cancelled`);
      progress.state = 'cancelled';
      progress.products.state = 'cancelled';
      pRetry(() => progress.save());
      return progress;
    }

    let seedProductsProgress : any = {
      shop: user.shop.myshopify_domain,
      sinceId: 0,
      lastId: null,
      syncedCount: 0,
      shopifyCount: await this.countFromShopify(user),
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
          this.eventService.off(`sync-attach:${shop}:${progress._id}`, attachCallback);
          this.eventService.off(`sync-cancel:${shop}:${progress._id}`, cancelCallback);
          this.logger.debug(`product sync ${progress._id}:${progress.products._id} cancelled`);
          progress.state = 'cancelled';
          progress.products.state = 'cancelled';
          pRetry(() => progress.save());
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

    await progress.save();

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
          /*await progress.update({products: {
            syncedCount: progress.orders.syncedCount,
            lastId: progress.orders.lastId,
          }});*/
          await pRetry(() => progress.save());
        }
        progress.products.state = 'success';
      } catch (error) {
        if (error.message === 'cancelled') {
          this.logger.debug(`product sync ${progress._id}:${progress.products._id} cancelled`);
          progress.state = 'cancelled';
          progress.products.state = 'cancelled';
        } else {
          progress.products.state = 'failed';
          progress.products.error = error.message;
          progress.lastError = `products:${error.message}`;
          this.logger.error(`product sync ${progress._id}:${progress.products._id} error:`, error.message);
        }
      }
      if (!progress.options.includeOrders) {
        progress.state = progress.products.state;
      } else if (progress.orders && progress.orders.state !== 'running') {
        if (progress.products.state === 'success' && progress.orders.state === 'success') {
          progress.state = 'success';
        } else if (progress.products.state === 'cancelled' || progress.orders.state === 'cancelled') {
          progress.state = 'cancelled';
        } else {
          progress.state = 'failed';
        }
      }
      this.eventService.off(`sync-attach:${shop}:${progress._id}`, attachCallback);
      this.eventService.off(`sync-cancel:${shop}:${progress._id}`, cancelCallback);
      await pRetry(() => progress.save());
    });

    return progress;
  }
}
