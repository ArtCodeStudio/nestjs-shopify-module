// Third party
import { Infrastructure, Options } from 'shopify-prime';
import { Document } from 'mongoose';
import * as pRetry from 'p-retry';

import { IShopifyConnect } from '../auth/interfaces/connect';
import { SyncProgressDocument, SubSyncProgressDocument, ISyncProgress, ISyncOptions } from '../interfaces';
import { listAllCallback, IListAllCallbackData, SyncOptions, ShopifyBaseObjectType, RootCount, RootGet, RootList } from './interfaces';
import { deleteUndefinedProperties, getDiff } from './helpers';
import { ShopifyApiRootService } from './shopify-api-root.service';

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

  public async listSyncProgress(shopifyConnect: IShopifyConnect): Promise<ISyncProgress[]> {
    return this.syncprogressModel.find({
      shop: shopifyConnect.myshopify_domain,
      [`options.include${this.upperCaseResourceName}`]: true,
    }).lean();
  }

  public async getLastSyncProgress(shopifyConnect: IShopifyConnect): Promise<ISyncProgress | null> {
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

  protected async syncedDataCallback(shopifyConnect: IShopifyConnect, subProgress: Partial<SubSyncProgressDocument>, options: ISyncOptions, data: IListAllCallbackData<ShopifyObjectType>) {
    const objects = data.data;
    subProgress.syncedCount += objects.length;
    subProgress.lastId = objects[objects.length-1].id;
  }

  protected getSyncListOptions(options: ISyncOptions): Partial<ListOptions> {
    return {};
  }

  protected getlastSyncProgressForOptions(shopifyConnect, options: ISyncOptions) {
    return {
      shop: shopifyConnect.myshopify_domain,
      [`options.include${this.upperCaseResourceName}`]: true,
    };
  }

  protected async seedSyncProgress(shopifyConnect: IShopifyConnect, options: ISyncOptions, lastProgress: SyncProgressDocument): Promise<Partial<SubSyncProgressDocument>> {
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
      let lastProgressWithTheseOptions: SyncProgressDocument | null;

      if (lastProgress[this.resourceName]) {
        lastSubProgress = lastProgress[this.resourceName];
        lastProgressWithTheseOptions = lastProgress;
      } else {
        lastProgressWithTheseOptions = await this.syncprogressModel.findOne(
          this.getlastSyncProgressForOptions(shopifyConnect, options),
          {},
          { sort: { 'createdAt': -1} }
        );
        lastSubProgress = lastProgressWithTheseOptions && lastProgressWithTheseOptions[this.resourceName];
      }

      if (lastSubProgress) {
        seedSubProgress.sinceId = lastSubProgress.lastId || 0;
        seedSubProgress.lastId = lastSubProgress.lastId;
        seedSubProgress.info = lastSubProgress.info;
        seedSubProgress.syncedCount = lastSubProgress.syncedCount;
        seedSubProgress.continuedFromPrevious = lastProgressWithTheseOptions._id;
      }
    }

    this.logger.debug(`seed sub-progress`, seedSubProgress);
    return seedSubProgress;
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
  public async startSync(shopifyConnect: IShopifyConnect, options: ISyncOptions, progress: SyncProgressDocument, lastProgress?: SyncProgressDocument): Promise<SubSyncProgressDocument> {
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

    // The actual sync action:

    progress[this.resourceName].state = 'running';

    let listAllError: Error | null = null;

    const listAllCallback = async (error: Error, data: IListAllCallbackData<ShopifyObjectType>) => {
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
    } as ListOptions;

    return pRetry(() => {
      return progress.save()
    })
    .then(async (progress) => {
      return this.listAllFromShopify(shopifyConnect, listAllOptions, listAllCallback)
      .then(() => {
        if (listAllError) {
          throw listAllError;
        }
        this.logger.debug(`${this.resourceName} sync ${syncSignal} success`);
        progress[this.resourceName].state = 'success';
        return pRetry(() => {
          return progress.save()
        })
        .then((progress) => {
          return progress[this.resourceName];
        })
      })
      .catch((error) => {
        if (error.message === 'cancelled') {
          this.logger.debug(`${this.resourceName} sync ${syncSignal} cancelled`);
          progress[this.resourceName].state = 'cancelled';
        } else {
          this.logger.error(`${this.resourceName} sync ${syncSignal} error`, error);
          progress[this.resourceName].state = 'failed';
          progress[this.resourceName].error = error.message;
          // TODO ? progress.lastError = `${this.resourceName}:${error.message}`;
        }
        return pRetry(() => {
          return progress.save()
        })
        .then((progress) => {
          return progress[this.resourceName];
        })
      });
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