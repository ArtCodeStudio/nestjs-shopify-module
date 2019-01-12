import { IShopifyConnect } from '../auth/interfaces/connect';
import { Infrastructure, Options } from 'shopify-prime';
import { Model, Document } from 'mongoose';
import { SyncProgressDocument, SubSyncProgressDocument, ISyncProgress, ISyncOptions } from '../interfaces';
import { BulkWriteOpResultObject } from 'mongodb';
import { DebugService } from '../debug.service';
import { deleteUndefinedProperties, getDiff } from './helpers';
import * as pRetry from 'p-retry';
import { listAllCallback, IListAllCallbackData } from './interfaces';
import { Readable } from 'stream';

import { EventService } from '../event.service';

import { Observable, Observer } from 'rxjs';
import { WsResponse } from '@nestjs/websockets';

export abstract class ShopifyApiBaseService<
    ShopifyObjectType,
    ShopifyModelClass extends Infrastructure.BaseService,
    DatabaseDocumentType extends Document,
  > {

  logger = new DebugService(`shopify:${this.constructor.name}`);

  abstract resourceName: string; // resource name: 'orders', 'products', etc.
  get upperCaseResourceName(): string {
    return this.resourceName[0].toUpperCase + this.resourceName.substr(1);
  }

  abstract subResourceNames: string[]; // e.g. 'transactions' in case of orders
  get upperCaseResourceNames(): string[] {
    return this.subResourceNames.map((name) => {
      return name[0].toUpperCase + name.substr(1);
    });
  }

  constructor(
    readonly dbModel: (shopName: string) => Model<DatabaseDocumentType>,
    readonly ShopifyModel: new (shopDomain: string, accessToken: string) => ShopifyModelClass,
    readonly events: EventService,
  ) {}

  /**
   * Retrieves a single order from the app's own database.
   * @param user 
   * @param id 
   */
  async getFromDb(user: IShopifyConnect, conditions): Promise<ShopifyObjectType | null> {
    return this.dbModel(user.shop.myshopify_domain).findOne(conditions).select('-_id -__v').lean();
  }

  /**
   * Retrieves a count of products from the app's own database.
   * @param user 
   * @param options 
   */
  async countFromDb(user: IShopifyConnect, conditions = {}): Promise<number> {
    return this.dbModel(user.shop.myshopify_domain).count(conditions);
  }

  /**
   * Retrieves a list of products from the app's own database.
   * @param user 
   */
  async listFromDb(user: IShopifyConnect, conditions = {}): Promise<ShopifyObjectType[]> {
    return this.dbModel(user.shop.myshopify_domain).find(conditions).select('-_id -__v').lean();
  }

  /**
   * Internal method to update or create a single product in the app database.
   * @param user 
   * @param product 
   */
  async updateOrCreateInDb(user: IShopifyConnect, conditions, update: Partial<ShopifyObjectType>) {
    const model = this.dbModel(user.shop.myshopify_domain);
    return model.findOneAndUpdate(conditions, update, {upsert: true});
  }

  /**
   * Internal method to update several products in the app database.
   * @param user 
   * @param products 
   */
  async updateOrCreateManyInDb(user: IShopifyConnect, selectBy: string, objects: ShopifyObjectType[]): Promise<BulkWriteOpResultObject | {}> {
    // An empty bulkwrite is not allowed. Just return an empty object if the passed array is empty.
    if (objects.length === 0) {
      return {};
    }
    const model = this.dbModel(user.shop.myshopify_domain);
    return model.collection.bulkWrite(
      objects.map((object: ShopifyObjectType) => {
        return {
          replaceOne: {
            filter: {
              id: object[selectBy]
            },
            replacement: object,
            upsert: true,
          }
        }
      })
    );
  }
}

export interface SyncOptions {
  sync?: boolean,
  failOnSyncError?: boolean,
  cancelSignal?: string,
}

export interface RootCount<CountOptions extends object = {}> {
  count(options: CountOptions): Promise<number>;
}

export interface ChildCount<CountOptions extends object = {}> {
  count(parentId: number, options: CountOptions): Promise<number>;
}

export interface RootGet<ShopifyObjectType, GetOptions extends SyncOptions = SyncOptions> {
  get(id: number, options?: GetOptions): Promise<ShopifyObjectType | null>;
}

export interface ChildGet<ShopifyObjectType, GetOptions extends SyncOptions = SyncOptions> {
  get(parentId: number, id: number, options?: GetOptions): Promise<ShopifyObjectType | null>;
}

export interface RootList<ShopifyObjectType, ListOptions extends SyncOptions & Options.BasicListOptions = SyncOptions & Options.BasicListOptions> {
  list(options: ListOptions): Promise<ShopifyObjectType[]>;
}

export interface ChildList<ShopifyObjectType, ListOptions extends SyncOptions & Options.BasicListOptions = SyncOptions & Options.BasicListOptions> {
  list(parentId: number, options: ListOptions): Promise<ShopifyObjectType[]>;
}

export interface ShopifyBaseObjectType {
  id: number;
}


export abstract class ShopifyApiRootService<
  ShopifyObjectType extends ShopifyBaseObjectType,
  ShopifyModelClass extends Infrastructure.BaseService & RootGet<ShopifyObjectType, GetOptions> & RootList<ShopifyObjectType, ListOptions>,
  GetOptions extends SyncOptions = SyncOptions,
  ListOptions extends SyncOptions & Options.BasicListOptions = SyncOptions & Options.BasicListOptions,
  DatabaseDocumentType extends Document = ShopifyObjectType & Document,
> extends ShopifyApiBaseService<
  ShopifyObjectType,
  ShopifyModelClass,
  DatabaseDocumentType
> {

  constructor(
    readonly dbModel: (shopName: string) => Model<DatabaseDocumentType>,
    readonly ShopifyModel: new (shopDomain: string, accessToken: string) => ShopifyModelClass,
    readonly events: EventService,
    readonly syncprogressModel: Model<SyncProgressDocument>
  ) {
    super(dbModel, ShopifyModel, events);
  }

  /**
   * Retrieves a single order directly from the shopify API
   * @param user 
   * @param id 
   * @param sync 
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  public async getFromShopify(user: IShopifyConnect, id: number, options?: GetOptions): Promise<ShopifyObjectType | null> {
    const shopifyModel = new this.ShopifyModel(user.myshopify_domain, user.accessToken);
    const sync = options && options.sync;
    if (sync) {
      delete options.sync;
    }
    const res = await pRetry(() => shopifyModel.get(id, options));
    if (sync) {
      await this.updateOrCreateInDb(user, {id}, res);
    }
    return res;
  }

  /**
   * Retrieves a list of orders directly from shopify.
   * @param user
   * @param options
   */
  public async listFromShopify(shopifyConnect: IShopifyConnect, options?: ListOptions): Promise<ShopifyObjectType[]> {
    const shopifyModel = new this.ShopifyModel(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    let sync = options && options.sync;
    options = Object.assign({}, options);
    let failOnSyncError = options && options.failOnSyncError;
    if (sync) {
      delete options.sync;
      delete options.failOnSyncError;
      delete options.cancelSignal;
    }
    const res = await pRetry(() => shopifyModel.list(options));
    if (sync) {
      const syncRes = this.updateOrCreateManyInDb(shopifyConnect, 'id', res)
      if (failOnSyncError) {
        return syncRes.then(() => res);
      } else {
        syncRes.catch((e: Error) => {
          this.logger.error(e);
        });
      }
    }
    return res;
  }

  /**
   * Gets a list of all of the shop's products directly from the shopify API
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, options?: ListOptions): Promise<ShopifyObjectType[]>
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, options: ListOptions, listAllPageCallback: listAllCallback<ShopifyObjectType>): Promise<void>
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, options?: ListOptions, listAllPageCallback?: listAllCallback<ShopifyObjectType>): Promise<ShopifyObjectType[]|void> {
    // Delete undefined options
    deleteUndefinedProperties(options);

    return this.listFromShopify(shopifyConnect, options)
    .then((objects) => {
      if (typeof (listAllPageCallback) === 'function') {
        listAllPageCallback(null, {
          pages: 1, page: 1, data: objects
        });
        return;
      } else {
        return objects;
      }
    })
    .catch((error) => {
      if (typeof listAllPageCallback === 'function') {
        listAllPageCallback(error, null);
      } else {
        throw error;
      }
    });
  }

  /**
   * Gets a list of all of the shop's products directly from the shopify API as a stream
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyStream(shopifyConnect: IShopifyConnect, options?: ListOptions): Readable {
    const stream = new Readable({objectMode: true, read: s=>s});
    stream.push('[\n');
    this.listAllFromShopify(shopifyConnect, options, (error, data) => {
      if (error) {
        stream.emit('error', error);
      } else {
        const objects = data.data;
        for (let j = 0; j < objects.length-1; j++) {
          stream.push(JSON.stringify([objects[j]], null, 2).slice(2,-2) + ',');
        }
        stream.push(JSON.stringify([objects[objects.length-1]], null, 2).slice(2,-2));
        if (data.page === data.pages) {
          stream.push('\n]');
        } else {
          stream.push(',');
        }
      }
    })
    .then(() => {
      stream.push(null);
    })
    .catch((error) => {
      stream.emit('error', error);
    });
    return stream;
  }

  /**
   * Gets a list of the shop's products directly from the shopify API as an Observable
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyObservable(user: IShopifyConnect, eventName: string, options?: ListOptions): Observable<WsResponse<ShopifyObjectType>> {
    // Delete undefined options
    deleteUndefinedProperties(options);
    return Observable.create((observer: Observer<WsResponse<ShopifyObjectType>>) => {
      this.listAllFromShopify(user, options, (error, data) => {
        if (error) {
          observer.error(error);
        } else {
          const products = data.data;
          products.forEach((product, i) => {
            observer.next({
              event: eventName,
              data: product,
            });
          });
        }
      })
      .then(() => {
        observer.complete();
      })
      .catch((error) => {
        observer.error(error);
      });
    });
  }
};



export abstract class ShopifyApiRootCountableService<
  ShopifyObjectType extends ShopifyBaseObjectType,
  ShopifyModelClass extends Infrastructure.BaseService & RootCount<CountOptions> & RootGet<ShopifyObjectType, GetOptions> & RootList<ShopifyObjectType, ListOptions>,
  CountOptions extends object = {},
  GetOptions extends SyncOptions = SyncOptions,
  ListOptions extends CountOptions & SyncOptions & Options.ListOptions = CountOptions & SyncOptions & Options.ListOptions,
  DatabaseDocumentType extends Document = ShopifyObjectType & Document,
> extends ShopifyApiRootService<
  ShopifyObjectType,
  ShopifyModelClass,
  GetOptions,
  ListOptions,
  DatabaseDocumentType
> {

  public async countFromShopify(shopifyConnect: IShopifyConnect): Promise<number>
  public async countFromShopify(shopifyConnect: IShopifyConnect, options: CountOptions): Promise<number>
  public async countFromShopify(shopifyConnect: IShopifyConnect, options?: CountOptions): Promise<number> {
    const shopifyModel = new this.ShopifyModel(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    // Delete undefined options
    deleteUndefinedProperties(options);
    return pRetry(() => {
      return shopifyModel.count(options);
    });
  }

  /**
   * Gets a list of all of the shop's products directly from the shopify API
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, options?: ListOptions): Promise<ShopifyObjectType[]>
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, options: ListOptions, listAllPageCallback: listAllCallback<ShopifyObjectType>): Promise<void>
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, options?: ListOptions, listAllPageCallback?: listAllCallback<ShopifyObjectType>): Promise<ShopifyObjectType[]|void> {
    // Delete undefined options
    deleteUndefinedProperties(options);

    const results: ShopifyObjectType[] = [];
    const count = await this.countFromShopify(shopifyConnect, options);
    const itemsPerPage = 250;
    const pages = Math.ceil(count/itemsPerPage);

    let cancelled = false;

    const cancelHandler = () => {
      cancelled = true;
    }
    if (options && options.cancelSignal) {
      this.events.once(options.cancelSignal, cancelHandler);
    }

    for (let page = 1; page <= pages; page++) {
      await this.listFromShopify(shopifyConnect, {...options, page: page, limit: itemsPerPage})
      .then((objects) => {
        if (typeof (listAllPageCallback) === 'function') {
          listAllPageCallback(null, {
            pages, page, data: objects
          });
        } else {
          Array.prototype.push.apply(results, objects);
        }
      })
      .catch(async (error) => {
        if (typeof listAllPageCallback === 'function') {
          await listAllPageCallback(error, null);
          if (options.failOnSyncError) {
            this.events.off(options.cancelSignal, cancelHandler);
            throw new Error('cancelled');
          }
        } else {
          if (options.cancelSignal) {
            this.events.off(options.cancelSignal, cancelHandler);
          }
          throw error;
        }
      })
      if (cancelled) {
        this.events.off(options.cancelSignal, cancelHandler);
        throw new Error('cancelled');
      }
      await new Promise(res => setTimeout(res, 333));
    }
    if (options.cancelSignal) {
      this.events.off(options.cancelSignal, cancelHandler);
    }
    if (typeof (listAllPageCallback) === 'function') {
      return; // void; we do not need the result if we have a callback
    } else {
      return results;
    }
  }


  async listSyncProgress(shopifyConnect: IShopifyConnect): Promise<ISyncProgress[]> {
    return this.syncprogressModel.find({
      shop: shopifyConnect.myshopify_domain,
      [`options.include${this.upperCaseResourceName}`]: true,
    }).lean();
  }

  async getLastSyncProgress(shopifyConnect: IShopifyConnect): Promise<ISyncProgress | null> {
    return await this.syncprogressModel.findOne(
      {
        shop: shopifyConnect.myshopify_domain,
        [`options.include${this.upperCaseResourceName}`]: true,
      },
      {},
      { sort: { 'createdAt': -1} }
    )
    .lean();
  }

  async seedSyncProgress(shopifyConnect: IShopifyConnect, options: ISyncOptions, lastProgress: SyncProgressDocument) {
    const shop = shopifyConnect.myshopify_domain;
    let seedSubProgress: Partial<SubSyncProgressDocument> = {
      shop: shop,
      sinceId: 0,
      lastId: null,
      info: null,
      syncedCount: 0,
      shopifyCount: await this.countFromShopify(shopifyConnect),
      state: 'starting',
      error: null,
    }

    this.logger.debug(`seed sub-progress`, seedSubProgress);

    if (!options.resync && lastProgress) {
      let lastSubProgress: SubSyncProgressDocument | null;
      let lastProgressWithThis: SyncProgressDocument | null;

      if (lastProgress[this.resourceName]) {
        lastSubProgress = lastProgress[this.resourceName];
        lastProgressWithThis = lastProgress;
      } else {
        const lastProgressWithThisQuery = {
          shop: shop,
          [`options.include${this.upperCaseResourceName}`]: true,
        };
        lastProgressWithThis = await this.syncprogressModel.findOne(
          lastProgressWithThisQuery,
          {},
          { sort: { 'createdAt': -1} }
        );
        lastSubProgress = lastProgressWithThis && lastProgressWithThis[this.resourceName];
      }

      if (lastSubProgress) {
        seedSubProgress.sinceId = lastSubProgress.lastId || 0;
        seedSubProgress.lastId = lastSubProgress.lastId;
        seedSubProgress.info = lastSubProgress.info;
        seedSubProgress.syncedCount = lastSubProgress.syncedCount;
        seedSubProgress.continuedFromPrevious = lastProgressWithThis._id;
      }
    }

    this.logger.debug(`seed sub-progress`, seedSubProgress);
    return seedSubProgress;
  }

  protected async syncedDataCallback(shopifyConnect: IShopifyConnect, subProgress: Partial<SubSyncProgressDocument>, options: ISyncOptions, data: IListAllCallbackData<ShopifyObjectType>) {
    const objects = data.data;
    subProgress.syncedCount += objects.length;
    subProgress.lastId = objects[objects.length-1].id;
  }

  protected getSyncListOptions(options: ISyncOptions): Partial<ListOptions> {
    return {};
  }

  /**
   * 
   * @param shopifyConnect
   * @param options 
   * @param progress 
   * 
   * @event sync-cancel:[shop]:[lastProgressId] ()
   * @event sync (shop, lastProgress)
   * @event sync-cancelled:[shop]:[progressId] ()
   */
  async startSync(shopifyConnect: IShopifyConnect, options: ISyncOptions, progress: SyncProgressDocument, lastProgress?: SyncProgressDocument): Promise<void> {
    this.logger.debug(
      `startSync(
        ${JSON.stringify(options, null, 2)}
      )`
    );

    const shop: string = shopifyConnect.myshopify_domain;

    this.logger.debug('SyncProgress:', progress);

    progress[this.resourceName] = await this.seedSyncProgress(shopifyConnect, options, lastProgress);

    const syncSignal = `${progress._id}:${progress[this.resourceName]._id}`
    const cancelSignal = `sync-cancel:${shop}:${progress._id}`;

    await progress.save();

    // The actual sync action:

    progress[this.resourceName].state = 'running';

    let listAllError: Error | null = null;

    const listAllCallback = (error: Error, data: IListAllCallbackData<ShopifyObjectType>) => {
      if (error) {
        listAllError = error;
      } else {
        return this.syncedDataCallback(shopifyConnect, progress[this.resourceName], options, data)
        .then(() => {
          pRetry(() => {
            return progress.save();
          });
        });
      }
    };

    const listAllOptions = {
      sync: true,
      failOnSyncError: true,
      cancelSignal,
      since_id: progress[this.resourceName].sinceId,
      ...this.getSyncListOptions(options)
    } as ListOptions

    return this.listAllFromShopify(shopifyConnect, listAllOptions, listAllCallback)
    .then(() => {
      if (listAllError) {
        throw listAllError;
      } else {
        this.logger.debug(`${this.resourceName} sync ${syncSignal} success`);
        progress[this.resourceName].state = 'success';
      }
    })
    .catch((error) => {
      if (error.message === 'cancelled') {
        this.logger.debug(`${this.resourceName} sync ${syncSignal} cancelled`);
        progress[this.resourceName].state = 'cancelled';
      } else {
        this.logger.debug(`${this.resourceName} sync ${syncSignal} error`, error);
        progress[this.resourceName].state = 'failed';
        progress[this.resourceName].error = error.message;
        progress.lastError = `${this.resourceName}:${error.message}`;
      }
    });
  }

  /**
   * Internal method used for tests to compare the shopify products with the products in the app's own database
   * @param user 
   */
  public async diffSynced(user: IShopifyConnect): Promise<any> {
    const fromDb = await this.listFromDb(user);
    const fromShopify = await this.listAllFromShopify(user);
    console.log('from DB', fromDb.length);
    console.log('from Shopify', fromShopify.length);
    let dbObj;
    return fromShopify.map(obj => (dbObj = fromDb.find(x => x.id === obj.id)) && {[obj.id]: getDiff(obj, dbObj).filter(x=>x.operation!=='update' && !x.path.endsWith('._id'))})
    .reduce((a,c)=>({...a, ...c}), {})
  }
}




export abstract class ShopifyApiChildService<
  ShopifyObjectType extends ShopifyBaseObjectType,
  ShopifyModelClass extends Infrastructure.BaseService & ChildGet<ShopifyObjectType, GetOptions> & ChildList<ShopifyObjectType, ListOptions>,
  GetOptions extends SyncOptions = SyncOptions,
  ListOptions extends SyncOptions & Options.BasicListOptions = SyncOptions & Options.BasicListOptions,
  DatabaseDocumentType extends Document = ShopifyObjectType & Document,
> extends ShopifyApiBaseService<
  ShopifyObjectType,
  ShopifyModelClass,
  DatabaseDocumentType
> {
  /**
   * Retrieves a single order directly from the shopify API
   * @param user 
   * @param id 
   * @param sync 
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  public async getFromShopify(user: IShopifyConnect, parentId: number, id: number, options?: GetOptions): Promise<ShopifyObjectType | null> {
    const shopifyModel = new this.ShopifyModel(user.myshopify_domain, user.accessToken);
    const sync = options && options.sync;
    if (sync) {
      delete options.sync;
    }
    const res = await pRetry(() => shopifyModel.get(parentId, id, options));
    if (sync) {
      await this.updateOrCreateInDb(user, {id}, res);
    }
    return res;
  }

  /**
   * Retrieves a list of orders directly from shopify.
   * @param user
   * @param options
   */
  public async listFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options?: ListOptions): Promise<ShopifyObjectType[]> {
    const shopifyModel = new this.ShopifyModel(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    options = Object.assign({}, options);
    let sync = options && options.sync;
    let failOnSyncError = options && options.failOnSyncError;
    if (sync) {
      delete options.sync;
      delete options.failOnSyncError;
      delete options.cancelSignal;
    }
    const res = await pRetry(() => shopifyModel.list(parentId, options));
    if (sync) {
      const syncRes = this.updateOrCreateManyInDb(shopifyConnect, 'id', res)
      if (failOnSyncError) {
        return syncRes.then(() => res);
      } else {
        syncRes.catch((e: Error) => {
          this.logger.error(e);
        });
      }
    }
    return res;
  }

  /**
   * Gets a list of all of the shop's products directly from the shopify API
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options?: ListOptions): Promise<ShopifyObjectType[]>
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options: ListOptions, listAllPageCallback: listAllCallback<ShopifyObjectType>): Promise<void>
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options?: ListOptions, listAllPageCallback?: listAllCallback<ShopifyObjectType>): Promise<ShopifyObjectType[]|void> {
    // Delete undefined options
    deleteUndefinedProperties(options);

    return this.listFromShopify(shopifyConnect, parentId, options)
    .then((objects) => {
      if (typeof (listAllPageCallback) === 'function') {
        listAllPageCallback(null, {
          pages: 1, page: 1, data: objects
        });
        return;
      } else {
        return objects;
      }
    })
    .catch((error) => {
      if (typeof listAllPageCallback === 'function') {
        listAllPageCallback(error, null);
      } else {
        throw error;
      }
    });
  }

  /**
   * Gets a list of all of the shop's products directly from the shopify API as a stream
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyStream(shopifyConnect: IShopifyConnect, parentId: number, options?: ListOptions): Readable {
    const stream = new Readable({objectMode: true, read: s=>s});
    stream.push('[\n');
    this.listAllFromShopify(shopifyConnect, parentId, options, (error, data) => {
      if (error) {
        stream.emit('error', error);
      } else {
        const objects = data.data;
        for (let j = 0; j < objects.length-1; j++) {
          stream.push(JSON.stringify([objects[j]], null, 2).slice(2,-2) + ',');
        }
        stream.push(JSON.stringify([objects[objects.length-1]], null, 2).slice(2,-2));
        if (data.page === data.pages) {
          stream.push('\n]');
        } else {
          stream.push(',');
        }
      }
    })
    .then(() => {
      stream.push(null);
    })
    .catch((error) => {
      stream.emit('error', error);
    });
    return stream;
  }

  /**
   * Gets a list of the shop's products directly from the shopify API as an Observable
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyObservable(user: IShopifyConnect, parentId: number, eventName: string, options?: ListOptions): Observable<WsResponse<ShopifyObjectType>> {
    // Delete undefined options
    deleteUndefinedProperties(options);
    return Observable.create((observer: Observer<WsResponse<ShopifyObjectType>>) => {
      this.listAllFromShopify(user, parentId, options, (error, data) => {
        if (error) {
          observer.error(error);
        } else {
          const products = data.data;
          products.forEach((product, i) => {
            observer.next({
              event: eventName,
              data: product,
            });
          });
        }
      })
      .then(() => {
        observer.complete();
      })
      .catch((error) => {
        observer.error(error);
      });
    });
  }

}




export abstract class ShopifyApiChildCountableService<
  ShopifyObjectType extends ShopifyBaseObjectType,
  ShopifyModelClass extends Infrastructure.BaseService & ChildCount<CountOptions> & ChildGet<ShopifyObjectType, GetOptions> & ChildList<ShopifyObjectType, ListOptions>,
  CountOptions extends object = {},
  GetOptions extends SyncOptions = SyncOptions,
  ListOptions extends CountOptions & SyncOptions & Options.BasicListOptions = CountOptions & SyncOptions & Options.BasicListOptions,
  DatabaseDocumentType extends Document = ShopifyObjectType & Document,
> extends ShopifyApiChildService<
  ShopifyObjectType,
  ShopifyModelClass,
  GetOptions,
  ListOptions,
  DatabaseDocumentType
> {

  public async countFromShopify(shopifyConnect: IShopifyConnect, parentId: number): Promise<number>
  public async countFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options: CountOptions): Promise<number>
  public async countFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options?: CountOptions): Promise<number> {
    const shopifyModel = new this.ShopifyModel(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    // Delete undefined options
    deleteUndefinedProperties(options);
    return pRetry(() => {
      return shopifyModel.count(parentId, options);
    });
  }

}
