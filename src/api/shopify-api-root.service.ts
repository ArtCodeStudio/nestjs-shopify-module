// nest
import { WsResponse } from '@nestjs/websockets';

// Third party
import { Infrastructure, Options } from 'shopify-prime';
import * as pRetry from 'p-retry';
import { Readable } from 'stream';
import { Observable, Observer } from 'rxjs';
import { Model, Document } from 'mongoose';

import { IShopifyConnect } from '../auth/interfaces/connect';
import { SyncProgressDocument } from '../interfaces';
import { listAllCallback, SyncOptions, ShopifyBaseObjectType, RootGet, RootList } from './interfaces';
import { deleteUndefinedProperties } from './helpers';
import { EventService } from '../event.service';
import { ShopifyApiBaseService } from './shopify-api-base.service';
import { ElasticsearchService } from '../elasticsearch.service';

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
    protected readonly esService: ElasticsearchService,
    protected readonly dbModel: (shopName: string) => Model<DatabaseDocumentType>,
    protected readonly ShopifyModel: new (shopDomain: string, accessToken: string) => ShopifyModelClass,
    protected readonly events: EventService,
    protected readonly syncprogressModel: Model<SyncProgressDocument>
  ) {
    super(esService, dbModel, ShopifyModel, events);
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
    const syncToDb = options && options.syncToDb;
    const syncToSearch = options && options.syncToSearch;
    delete options.syncToDb;
    delete options.syncToSearch;
    return pRetry(() => {
      return shopifyModel.get(id, options)
    })
    .then(async (shopifyObj) => {
      return this.updateOrCreateInApp(user, 'id', shopifyObj, syncToDb, syncToSearch)
      .then((_) => {
        return shopifyObj;
      })
    });
  }

  /**
   * Retrieves a list of orders directly from shopify.
   * @param user
   * @param options
   */
  public async listFromShopify(shopifyConnect: IShopifyConnect, options?: ListOptions): Promise<ShopifyObjectType[]> {
    this.logger.debug('[listFromShopify]');
    // Delete undefined options
    deleteUndefinedProperties(options);
    const shopifyModel = new this.ShopifyModel(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    let syncToDb = options && options.syncToDb;
    let syncToSearch = options && options.syncToSearch;
    options = Object.assign({}, options);
    let failOnSyncError = options && options.failOnSyncError;
    delete options.syncToDb;
    delete options.syncToSearch;
    delete options.failOnSyncError;
    delete options.cancelSignal; // TODO?
    return pRetry(async (count) => {
      this.logger.debug('[listFromShopify] retry count: ' + count);
      return shopifyModel.list(options)
      .catch((error) => {
        this.logger.error(error);
        throw error;
      })
    })
    .then((shopifyObjects: ShopifyObjectType[]) => {
      this.logger.debug('[listFromShopify] result length', shopifyObjects.length);
      this.logger.debug('[listFromShopify] updateOrCreateManyInApp');
      return this.updateOrCreateManyInApp(shopifyConnect, 'id', shopifyObjects, syncToDb, syncToSearch)
      .then((syncResult) => {
        return shopifyObjects;
      })
      .catch((error) => {
        this.logger.error(error);
        if (failOnSyncError) {
          throw error;
        }
        return shopifyObjects;
      });
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