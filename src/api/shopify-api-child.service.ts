// nest
import { WsResponse } from '@nestjs/websockets';

// third party
import { Infrastructure, Options } from 'shopify-prime';
import { Document } from 'mongoose';
import * as pRetry from 'p-retry';
import { Readable } from 'stream';
import { Observable, Observer } from 'rxjs';

import { IShopifyConnect } from '../auth/interfaces';
import { listAllCallback, ISyncOptions, ShopifyBaseObjectType, ChildGet, ChildList } from './interfaces';
import { deleteUndefinedProperties } from '../helpers';
import { ShopifyApiBaseService } from './shopify-api-base.service';

export abstract class ShopifyApiChildService<
  ShopifyObjectType extends ShopifyBaseObjectType,
  ShopifyModelClass extends Infrastructure.BaseService & ChildGet<ShopifyObjectType, GetOptions> & ChildList<ShopifyObjectType, ListOptions>,
  GetOptions extends ISyncOptions = ISyncOptions,
  ListOptions extends ISyncOptions & Options.BasicListOptions = ISyncOptions & Options.BasicListOptions,
  DatabaseDocumentType extends Document = ShopifyObjectType & Document,
> extends ShopifyApiBaseService<
  ShopifyObjectType,
  ShopifyModelClass,
  DatabaseDocumentType
> {
  /**
   * Retrieves a single `ShopifyObjectType[]` directly from the shopify API
   * @param user
   * @param id
   * @param sync
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  public async getFromShopify(user: IShopifyConnect, parentId: number, id: number, options?: GetOptions): Promise<Partial<ShopifyObjectType> | null> {
    const shopifyModel = new this.ShopifyModel(user.myshopify_domain, user.accessToken);
    const syncToDb = options && options.syncToDb;
    const syncToSearch = options && options.syncToSearch;
    delete options.syncToDb;
    delete options.syncToSearch;
    return pRetry(() => {
      return shopifyModel.get(parentId, id, options);
    })
    .then(async (shopifyObjectType) => {
      return this.updateOrCreateInApp(user, 'id', shopifyObjectType, syncToDb, syncToSearch)
      .then((_) => {
        return shopifyObjectType;
      });
    });
  }

  /**
   * Retrieves a list of `ShopifyObjectType[]` directly from shopify.
   * @param user
   * @param options
   */
  public async listFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options?: ListOptions): Promise<Partial<ShopifyObjectType>[]> {
    const shopifyModel = new this.ShopifyModel(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    options = Object.assign({}, options);
    const syncToDb = options && options.syncToDb;
    const syncToSearch = options && options.syncToSearch;
    const failOnSyncError = options && options.failOnSyncError;
    delete options.syncToDb;
    delete options.syncToSearch;
    delete options.failOnSyncError;
    delete options.cancelSignal; // TODO?
    return pRetry(() => {
      return shopifyModel.list(parentId, options);
    })
    .then(async (shopifyListObjs) => {
      return this.updateOrCreateManyInApp(shopifyConnect, 'id', shopifyListObjs, syncToDb, syncToSearch)
      .then(() => {
        return shopifyListObjs;
      })
      .catch((e: Error) => {
        this.logger.error(e);
        if (failOnSyncError) {
          throw e;
        }
        return shopifyListObjs;
      });
    });

  }

  /**
   * Gets a list of all `ShopifyObjectType[]` directly from the shopify API
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(
    shopifyConnect: IShopifyConnect,
    parentId: number,
    options?: ListOptions,
  ): Promise<Partial<ShopifyObjectType>[]>;
  public async listAllFromShopify(
    shopifyConnect: IShopifyConnect,
    parentId: number,
    options: ListOptions,
    listAllPageCallback: listAllCallback<Partial<ShopifyObjectType>>,
  ): Promise<void>;
  public async listAllFromShopify(
    shopifyConnect: IShopifyConnect,
    parentId: number,
    options?: ListOptions,
    listAllPageCallback?: listAllCallback<Partial<ShopifyObjectType>>,
  ): Promise<Partial<ShopifyObjectType>[]|void> {
    // Delete undefined options
    deleteUndefinedProperties(options);

    return this.listFromShopify(shopifyConnect, parentId, options)
    .then((objects) => {
      if (typeof (listAllPageCallback) === 'function') {
        listAllPageCallback(null, {
          pages: 1, page: 1, data: objects,
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
   * Gets a list of all `ShopifyObjectType[]` directly from the shopify API as a stream
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyStream(shopifyConnect: IShopifyConnect, parentId: number, options?: ListOptions): Readable {
    const stream = new Readable({objectMode: true, read: s => s});
    stream.push('[\n');
    this.listAllFromShopify(shopifyConnect, parentId, options, (error, data) => {
      if (error) {
        stream.emit('error', error);
      } else {
        const objects = data.data;
        for (let j = 0; j < objects.length - 1; j++) {
          stream.push(JSON.stringify([objects[j]], null, 2).slice(2, -2) + ',');
        }
        stream.push(JSON.stringify([objects[objects.length - 1]], null, 2).slice(2, -2));
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
   * Gets a list of `ShopifyObjectType[]` directly from the shopify API as an Observable
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyObservable(
    user: IShopifyConnect,
    parentId: number,
    eventName: string,
    options?: ListOptions,
  ): Observable<WsResponse<Partial<ShopifyObjectType>>> {
    // Delete undefined options
    deleteUndefinedProperties(options);
    return Observable.create((observer: Observer<WsResponse<Partial<ShopifyObjectType>>>) => {
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