// nest
import { WsResponse } from "@nestjs/websockets";

// Third party
import { Infrastructure, Options } from "shopify-admin-api";
import { shopifyRetry } from "../helpers";
import { Readable } from "stream";
import { Observable, Observer } from "rxjs";
import { Model, Document } from "mongoose";

import { IShopifyConnect } from "../auth/interfaces/connect";
import { SyncProgressDocument, ShopifyModuleOptions } from "../interfaces";
import {
  listAllCallback,
  ISyncOptions,
  ShopifyBaseObjectType,
  RootGet,
  RootList,
} from "./interfaces";
import { deleteUndefinedProperties } from "../helpers";
import { EventService } from "../event.service";
import { ShopifyApiBaseService } from "./shopify-api-base.service";

export abstract class ShopifyApiRootService<
  ShopifyObjectType extends ShopifyBaseObjectType,
  ShopifyModelClass extends Infrastructure.BaseService &
    RootGet<ShopifyObjectType, GetOptions> &
    RootList<ShopifyObjectType, ListOptions>,
  GetOptions extends ISyncOptions = ISyncOptions,
  ListOptions extends ISyncOptions & Options.BasicListOptions = ISyncOptions &
    Options.BasicListOptions,
  DatabaseDocumentType extends Document = ShopifyObjectType & Document
> extends ShopifyApiBaseService<
  ShopifyObjectType,
  ShopifyModelClass,
  DatabaseDocumentType
> {
  constructor(
    protected readonly dbModel: (
      shopName: string
    ) => Model<DatabaseDocumentType>,
    protected readonly ShopifyModel: new (
      shopDomain: string,
      accessToken: string
    ) => ShopifyModelClass,
    protected readonly events: EventService,
    protected readonly syncprogressModel: Model<SyncProgressDocument>,
    protected readonly shopifyModuleOptions: ShopifyModuleOptions
  ) {
    super(dbModel, ShopifyModel, events, shopifyModuleOptions);
  }

  /**
   * Retrieves a single `ShopifyObjectType` directly from the shopify API
   * @param user
   * @param id
   * @param sync
   * @see https://help.shopify.com/en/api/reference/products/product#show
   */
  public async getFromShopify(
    user: IShopifyConnect,
    id: number,
    options?: GetOptions
  ): Promise<Partial<ShopifyObjectType> | null> {
    const shopifyModel = new this.ShopifyModel(
      user.myshopify_domain,
      user.accessToken
    );
    const syncToDb = options && options.syncToDb;
    if (options) {
      delete options.syncToDb;
    }

    const shopifyObj = await shopifyRetry(() => {
      return shopifyModel.get(id, options);
    });

    if (
      this.shopifyModuleOptions.sync.enabled &&
      this.shopifyModuleOptions.sync.autoSyncResources.includes(
        this.resourceName
      )
    ) {
      await this.updateOrCreateInApp(user, "id", shopifyObj, syncToDb);
    }

    return shopifyObj;
  }

  /**
   * Retrieves a list of `ShopifyObjectType` directly from shopify.
   * @param user
   * @param options
   */
  public async listFromShopify(
    shopifyConnect: IShopifyConnect,
    options?: ListOptions
  ): Promise<Partial<ShopifyObjectType>[]> {
    // Delete undefined options
    deleteUndefinedProperties(options);

    this.logger.debug("[listFromShopify] %O", options);
    const shopifyModel = new this.ShopifyModel(
      shopifyConnect.myshopify_domain,
      shopifyConnect.accessToken
    );
    const syncToDb = options && options.syncToDb;
    options = Object.assign({}, options);
    const failOnSyncError = options && options.failOnSyncError;
    delete options.syncToDb;
    delete options.failOnSyncError;
    delete options.cancelSignal; // TODO@Moritz?
    return shopifyRetry(async (count) => {
      this.logger.debug("[listFromShopify] retry count: %d" + count);
      return shopifyModel.list(options).catch((error) => {
        this.logger.error(error);
        throw error;
      });
    }).then(async (shopifyObjects: ShopifyObjectType[]) => {
      this.logger.debug(
        "[listFromShopify] result length %d",
        shopifyObjects.length
      );
      this.logger.debug("[listFromShopify] updateOrCreateManyInApp");
      return this.updateOrCreateManyInApp(
        shopifyConnect,
        "id",
        shopifyObjects,
        syncToDb
      )
        .then((/*syncResult*/) => {
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
   * Gets a list of all of the shop's `ShopifyObjectType` directly from the shopify API
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(
    shopifyConnect: IShopifyConnect,
    options?: ListOptions
  ): Promise<Partial<ShopifyObjectType>[]>;
  public async listAllFromShopify(
    shopifyConnect: IShopifyConnect,
    options: ListOptions,
    listAllPageCallback: listAllCallback<Partial<ShopifyObjectType>>
  ): Promise<void>;
  public async listAllFromShopify(
    shopifyConnect: IShopifyConnect,
    options?: ListOptions,
    listAllPageCallback?: listAllCallback<Partial<ShopifyObjectType>>
  ): Promise<Partial<ShopifyObjectType>[] | void> {
    // Delete undefined options
    deleteUndefinedProperties(options);
    this.logger.debug("[listAllFromShopify] %O", options);

    return this.listFromShopify(shopifyConnect, options)
      .then((objects) => {
        if (typeof listAllPageCallback === "function") {
          listAllPageCallback(null, {
            pages: 1,
            page: 1,
            data: objects,
          });
          return;
        } else {
          return objects;
        }
      })
      .catch((error) => {
        if (typeof listAllPageCallback === "function") {
          listAllPageCallback(error, null);
        } else {
          throw error;
        }
      });
  }

  /**
   * Gets a list of all of the shop's `ShopifyObjectType` directly from the shopify API as a stream
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyStream(
    shopifyConnect: IShopifyConnect,
    options?: ListOptions
  ): Readable {
    const stream = new Readable({ objectMode: true, read: (s) => s });
    stream.push("[\n");
    this.listAllFromShopify(shopifyConnect, options, (error, data) => {
      if (error) {
        stream.emit("error", error);
      } else {
        const objects = data.data;
        for (let j = 0; j < objects.length - 1; j++) {
          stream.push(JSON.stringify([objects[j]], null, 2).slice(2, -2) + ",");
        }
        stream.push(
          JSON.stringify([objects[objects.length - 1]], null, 2).slice(2, -2)
        );
        if (data.page === data.pages) {
          stream.push("\n]");
        } else {
          stream.push(",");
        }
      }
    })
      .then(() => {
        stream.push(null);
      })
      .catch((error) => {
        stream.emit("error", error);
      });
    return stream;
  }

  /**
   * Gets a list of the shop's `ShopifyObjectType` directly from the shopify API as an Observable
   * @param options Options for filtering the results.
   */
  public listAllFromShopifyObservable(
    user: IShopifyConnect,
    eventName: string,
    options?: ListOptions
  ): Observable<WsResponse<Partial<ShopifyObjectType>>> {
    // Delete undefined options
    deleteUndefinedProperties(options);
    return Observable.create(
      (observer: Observer<WsResponse<Partial<ShopifyObjectType>>>) => {
        this.listAllFromShopify(user, options, (error, data) => {
          if (error) {
            observer.error(error);
          } else {
            const shopifyObjectTypes = data.data;
            shopifyObjectTypes.forEach((shopifyObjectType) => {
              observer.next({
                event: eventName,
                data: shopifyObjectType,
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
      }
    );
  }
}
