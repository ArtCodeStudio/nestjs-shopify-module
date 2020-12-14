// Third party
import { Infrastructure, Options } from 'shopify-admin-api';
import { Document, Types } from 'mongoose';
import { shopifyRetry, mongooseParallelRetry } from '../helpers';

import { IShopifyConnect } from '../auth/interfaces/connect';
import { SyncProgressDocument, SubSyncProgressDocument, IStartSyncOptions, ISubSyncProgressFinishedCallback } from '../interfaces';
import { listAllCallback, IListAllCallbackData, ISyncOptions, ShopifyBaseObjectType, RootCount, RootGet, RootList } from './interfaces';
import { deleteUndefinedProperties, getDiff } from '../helpers';
import { ShopifyApiRootService } from './shopify-api-root.service';

export abstract class ShopifyApiRootCountableService<
  ShopifyObjectType extends ShopifyBaseObjectType,
  ShopifyModelClass extends
  Infrastructure.BaseService
  & RootCount<CountOptions>
  & RootGet<ShopifyObjectType, GetOptions>
  & RootList<ShopifyObjectType, ListOptions>,
  CountOptions,
  GetOptions extends ISyncOptions = ISyncOptions,
  ListOptions extends CountOptions & ISyncOptions & Options.ListOptions = CountOptions & ISyncOptions & Options.ListOptions,
  DatabaseDocumentType extends Document = ShopifyObjectType & Document,
> extends ShopifyApiRootService<
  ShopifyObjectType,
  ShopifyModelClass,
  GetOptions,
  ListOptions,
  DatabaseDocumentType
> {

  public async countFromShopify(shopifyConnect: IShopifyConnect, options?: CountOptions): Promise<number> {
    const shopifyModel = new this.ShopifyModel(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    // Delete undefined options
    deleteUndefinedProperties(options);
    return shopifyRetry(() => {
      return shopifyModel.count(options);
    });
  }

  /**
   * Gets a list of all of the shop's products directly from the shopify API
   * @param options Options for filtering the results.
   */
  public async listAllFromShopify(shopifyConnect: IShopifyConnect, options?: ListOptions): Promise<Partial<ShopifyObjectType>[]>;
  public async listAllFromShopify(
    shopifyConnect: IShopifyConnect,
    options: ListOptions,
    listAllPageCallback: listAllCallback<Partial<ShopifyObjectType>>,
  ): Promise<void>;
  public async listAllFromShopify(
    shopifyConnect: IShopifyConnect,
    options?: ListOptions,
    listAllPageCallback?: listAllCallback<Partial<ShopifyObjectType>>,
  ): Promise<Partial<ShopifyObjectType>[]|void> {
    // Delete undefined options
    deleteUndefinedProperties(options);

    const results: ShopifyObjectType[] = [];
    const count = await this.countFromShopify(shopifyConnect, options);
    const itemsPerPage = 250;
    const pages = Math.ceil(count / itemsPerPage);

    let cancelled = false;

    const cancelHandler = () => {
      cancelled = true;
    };
    if (options && options.cancelSignal) {
      this.events.once(options.cancelSignal, cancelHandler);
    }

    for (let page = 1; page <= pages; page++) {
      await this.listFromShopify(shopifyConnect, {...options, page, limit: itemsPerPage})
      .then((objects) => {
        if (typeof (listAllPageCallback) === 'function') {
          listAllPageCallback(null, {
            pages, page, data: objects,
          });
        } else {
          Array.prototype.push.apply(results, objects);
        }
      })
      .catch(async (error) => {
        this.logger.error(`${this.resourceName} sync error`, error);
        if (typeof listAllPageCallback === 'function') {
          await listAllPageCallback(error, null);
          if (options.failOnSyncError) {
            this.events.off(options.cancelSignal, cancelHandler);
            throw error;
          }
        } else {
          if (options.cancelSignal) {
            this.events.off(options.cancelSignal, cancelHandler);
          }
          throw error;
        }
      });
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

  public async listSyncProgress(shopifyConnect: IShopifyConnect) {
    return this.syncprogressModel.find({
      shop: shopifyConnect.myshopify_domain,
      [`options.include${this.upperCaseResourceName}`]: true,
    }).lean();
  }

  public async getLastSyncProgress(shopifyConnect: IShopifyConnect) {
    return await this.syncprogressModel.findOne(
      {
        shop: shopifyConnect.myshopify_domain,
        [`options.include${this.upperCaseResourceName}`]: true,
      },
      {},
      // TODO NEST7 CHECKME{ sort: { createdAt: -1} },
    )
    .lean();
  }

  protected async syncedDataCallback(
    shopifyConnect: IShopifyConnect,
    progress: SyncProgressDocument,
    subProgress: Partial<SubSyncProgressDocument>,
    options: IStartSyncOptions,
    data: IListAllCallbackData<ShopifyObjectType>,
  ) {
    const objects = data.data;
    subProgress.syncedCount += objects.length;
    subProgress.lastId = objects[objects.length - 1].id;
  }

  protected getSyncCountOptions(options: IStartSyncOptions): CountOptions {
    this.logger.debug(`getSyncCountOptions %O`, options);
    return {} as CountOptions;
  }

  protected async seedSyncProgress(
    shopifyConnect: IShopifyConnect,
    options: IStartSyncOptions,
    lastProgress: SyncProgressDocument,
  ): Promise<Partial<SubSyncProgressDocument>> {
    const shop = shopifyConnect.myshopify_domain;
    const countOptions = this.getSyncCountOptions(options);

    this.logger.debug(`seedSyncProgress[${this.resourceName}] options: %O`, options);
    const includedSubResourceNames = this.upperCaseSubResourceNames.filter((subResourceName: string) => {
      const string = `include${subResourceName}`;
      const result = options[`include${subResourceName}`];
      this.logger.debug(`${string}: ${result}`);
      return result;
    });

    const seedSubProgress: Partial<SubSyncProgressDocument> = {
      shop,
      sinceId: 0,
      lastId: null,
      info: null,
      syncedCount: 0,
      shopifyCount: await this.countFromShopify(shopifyConnect, countOptions),
      state: 'starting',
      error: null,
    };

    includedSubResourceNames.forEach((subResourceName: string) => {
      seedSubProgress[`synced${subResourceName}Count`] = 0;
    });

    this.logger.debug(`includedSubResourceNames %O`, includedSubResourceNames);
    if (!options.resync && lastProgress) {
      let lastSubProgress: SubSyncProgressDocument | null;
      let lastProgressWithTheseOptions: SyncProgressDocument | null;

      if (
        lastProgress[this.resourceName]
        && !includedSubResourceNames.some((subResourceName: string) => {
          return !lastProgress.options[`include${subResourceName}`];
        })
      ) {
        lastSubProgress = lastProgress[this.resourceName];
        lastProgressWithTheseOptions = lastProgress;
      } else {
        const conditions = {
          shop: shopifyConnect.myshopify_domain,
          [`options.include${this.upperCaseResourceName}`]: true,
        };
        includedSubResourceNames.forEach((subResourceName: string) => {
          conditions[`options.include${subResourceName}`] = true;
        });
        lastProgressWithTheseOptions = await this.syncprogressModel.findOne(
          conditions,
          {},
          // TODO NEST7 CHECKME { sort: { createdAt: -1} },
        );
        lastSubProgress = lastProgressWithTheseOptions && lastProgressWithTheseOptions[this.resourceName];
      }

      if (lastSubProgress) {
        seedSubProgress.sinceId = lastSubProgress.lastId || 0;
        seedSubProgress.lastId = lastSubProgress.lastId || null;
        seedSubProgress.info = lastSubProgress.info || null;
        seedSubProgress.syncedCount = lastSubProgress.syncedCount || 0;
        includedSubResourceNames.forEach((subResourceName: string) => {
          seedSubProgress[`synced${subResourceName}Count`] = lastSubProgress[`synced${subResourceName}Count`];
        });
        seedSubProgress.continuedFromPrevious = new Types.ObjectId(lastProgressWithTheseOptions._id);
      }
    }

    // this.logger.debug(`seed sub-progress %O`, seedSubProgress);
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
  public async startSync(
    shopifyConnect: IShopifyConnect,
    options: IStartSyncOptions,
    progress: SyncProgressDocument,
    lastProgress: SyncProgressDocument | null,
    finishedCallback?: ISubSyncProgressFinishedCallback,
  ) {
    this.logger.debug(`[startSync] start %O`, options);

    const shop: string = shopifyConnect.myshopify_domain;

    // this.logger.debug('SyncProgress: %O', progress);

    progress[this.resourceName] = await this.seedSyncProgress(shopifyConnect, options, lastProgress);

    const syncSignal = `${progress._id}:${progress[this.resourceName]._id}`;
    const cancelSignal = `sync-cancel:${shop}:${progress._id}`;

    // The actual sync action:

    progress[this.resourceName].state = 'running';

    let listAllError: Error | null = null;

    const _listAllCallback = async (error: Error, data: IListAllCallbackData<ShopifyObjectType>) => {
      if (error) {
        listAllError = error;
      } else {
        return this.syncedDataCallback(shopifyConnect, progress, progress[this.resourceName], options, data)
        .then(() => {
          return mongooseParallelRetry(() => {
            return progress.save();
          });
        })
        .then((progress2) => {
          return progress2[this.resourceName];
        });
      }
    };

    const listAllOptions: Partial<ListOptions> = {
      syncToDb: options.syncToDb,
      failOnSyncError: true,
      cancelSignal,
      since_id: progress[this.resourceName].sinceId,
      ...this.getSyncCountOptions(options),
    };

    // save the initialized progress for the first time
    await mongooseParallelRetry(() => {
      return progress.save();
    });

    // We don't want to return the result of this promise, but the initialized progress as it is now immediately.
    this.listAllFromShopify(shopifyConnect, listAllOptions as ListOptions, _listAllCallback)
    .then(async () => {
      if (listAllError) {
        throw listAllError;
      }
      this.logger.debug(`[${this.resourceName}] sync ${syncSignal} success`);
      progress[this.resourceName].state = 'success';
      return mongooseParallelRetry(() => {
        return progress.save();
      });
    })
    .catch(async (error) => {
      if (error.message === 'cancelled') {
        this.logger.debug(`[${this.resourceName}] sync ${syncSignal} cancelled`);
        progress[this.resourceName].state = 'cancelled';
      } else {
        this.logger.error(`[${this.resourceName}] sync ${syncSignal} error`, error);
        progress[this.resourceName].state = 'failed';
        const errMsg = `${error.message}\n${error.stack}`;
        progress[this.resourceName].error = `${error.message}` + process.env.NODE_ENV === 'development' ? `\n${error.stack}` : '';
        progress.lastError = `${this.resourceName}:${errMsg}`;
      }
    })
    .then(() => {
      return mongooseParallelRetry(() => {
        return progress.save();
      });
    })
    .then(() => {
      this.logger.debug(`[startSync] ${this.resourceName} done: ${progress[this.resourceName].state}`);
      if (typeof finishedCallback === 'function') {
        finishedCallback(progress[this.resourceName]);
      }
    });

    // return the initialized progress immediately
    return progress[this.resourceName];
  }

  /**
   * Internal method used for tests to compare the shopify products with the products in the app's own database
   * @param user
   */
  public async diffSynced(user: IShopifyConnect) {
    const fromDb = await this.listFromDb(user);
    const fromShopify = await this.listAllFromShopify(user);
    this.logger.debug('from DB %d', fromDb.length);
    this.logger.debug('from Shopify %d', fromShopify.length);
    let dbObj: any; // TODO@Moritz
    return fromShopify.map(obj =>
      (dbObj = fromDb.find(x =>
        // FIXME: should not be necessary to use "toString", as both should be integers. Something must be wrong in the DatabaseDocumentType definition (Document, DocumentType)
        x.id.toString() === obj.id.toString(),
      )) && {[obj.id]: getDiff(obj, dbObj).filter(x =>
        x.operation !== 'update' && !x.path.endsWith('._id'),
      )},
    )
    .reduce((a, c) => ({...a, ...c}), {});
  }
}