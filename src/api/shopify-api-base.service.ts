// Third party
import { BulkWriteOpResultObject } from 'mongodb';
import { Model, Document, Query} from 'mongoose';
import { Infrastructure } from 'shopify-admin-api';

import { IShopifyConnect } from '../auth/interfaces';
import { ShopifyModuleOptions, Resource } from '../interfaces';

import {
  IAppBasicListOptions,
} from './interfaces';
import { DebugService } from '../debug.service';
import { EventService } from '../event.service';
import { firstCharUppercase, underscoreCase, deleteUndefinedProperties } from '../helpers';

export abstract class ShopifyApiBaseService<
    ShopifyObjectType,
    ShopifyModelClass extends Infrastructure.BaseService,
    DatabaseDocumentType extends Document,
  > {

  protected logger = new DebugService(`shopify:${this.constructor.name}`);
  abstract resourceName: Resource; // resource name: 'orders', 'products', etc.

  /**
   * E.g. converts `products` to `Products`
   */
  get upperCaseResourceName(): string {
    return firstCharUppercase(this.resourceName);
  }

  abstract subResourceNames: string[]; // e.g. 'transactions' in case of orders

  get upperCaseSubResourceNames(): string[] {
    return this.subResourceNames.map((name) => {
      return firstCharUppercase(name);
    });
  }

  /**
   * E.g. converts `smartCollections` to `smart_collections`
   * Needed for Elasticsearch index where big letters are not allowed
   */
  get underscoreCaseResourceName(): string {
    return underscoreCase(this.resourceName);
  }

  constructor(
    protected readonly dbModel: (shopName: string) => Model<DatabaseDocumentType>,
    protected readonly ShopifyModel: new (shopDomain: string, accessToken: string) => ShopifyModelClass,
    protected readonly events: EventService,
    protected readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
  }

  /**
   * returns a Mongoose query object on this data model for the specified conditions.
   * This does not run the query yet.
   * The query object has a versatile API to specify further options and methods to
   * retrieve the data, through streams, callbacks, promises etc.
   *
   * @param user
   * @param conditions
   *
   * @see https://mongoosejs.com/docs/api.html#Query
   */
  public queryDb(shopifyConnect: IShopifyConnect, conditions = {})/*: MongooseQuery<ShopifyObjectType>*/ {
    return this.dbModel(shopifyConnect.shop.myshopify_domain)
    .find(conditions)
    .select('-_id -__v') // Removes :id and __v properties from result
    .lean(); // Just return the result data without mongoose methods like `.save()`
  }

  /**
   * Retrieves a single `ShopifyObjectType` from the app's mongodb database.
   * @param user
   * @param id
   */
  public async getFromDb(user: IShopifyConnect, conditions: any)/*: Promise<ShopifyObjectType | null>*/ {
    return this.dbModel(user.shop.myshopify_domain).findOne(conditions).select('-_id -__v').lean();
  }

  /**
   * Retrieves a count of `ShopifyObjectType` from the app's mongodb database.
   * @param user
   * @param options
   */
  async countFromDb(user: IShopifyConnect, conditions: any = {}): Promise<number> {
    return this.dbModel(user.shop.myshopify_domain)
    .find(conditions)
    .countDocuments(conditions);
  }

  /**
   * Set default list options like limit, sort, page, etc
   * @param basicOptions
   */
  protected setDefaultAppListOptions(basicOptions: IAppBasicListOptions) {

    basicOptions = deleteUndefinedProperties(basicOptions);

    if (isNaN(basicOptions.page)) {
      basicOptions.page = 1;
    }
    basicOptions.page = Math.max(1, basicOptions.page);

    if (isNaN(basicOptions.limit)) {
      basicOptions.limit = 50;
    }
    basicOptions.limit = Math.max(0, basicOptions.limit);

    if (!basicOptions.limit || basicOptions.limit > 250 || basicOptions.limit <= 0) {
      basicOptions.limit = 50;
    }

    if (!basicOptions.sort_by) {
      basicOptions.sort_by = 'created_at';
    }

    // Ascending Order or Descending Order
    if (!basicOptions.sort_dir) {
      basicOptions.sort_dir = 'asc';
    }

    return basicOptions;
  }

  /**
   * Retrieves a list of `ShopifyObjectType` from the app's mongodb database.
   * @param user
   */
  public async listFromDb(
    user: IShopifyConnect,
    conditions: any = {},
    basicOptions: IAppBasicListOptions = {},
    ) {

    basicOptions = this.setDefaultAppListOptions(basicOptions);
    /**
     * Just return the specified `fields` or removes mongodb internally _id and __v properties from result
     */
    const fields: any = {
      _id: 0,
    };

    /**
     * Convert fields to mongodb fields
     */
    if (basicOptions.fields) {
      const _fields = basicOptions.fields.replace(/\s/g, '').split(',');
      if (_fields.length >= 1) {
        for (const field of _fields) {
          fields[field] = 1;
        }
      } else {
        // Projection cannot have a mix of inclusion and exclusion so just add exclusion for internal mongodb properties
        fields.__v = 0;
      }
    }

    /**
     * Implements text search
     * @see https://docs.mongodb.com/manual/text-search/
     */
    if (basicOptions.text) {
      conditions.$text = conditions.$text || {};
      conditions.$text = {
        $search: basicOptions.text,
      };
    }

    /**
     * Filter by ids
     * @see https://docs.mongodb.com/manual/reference/operator/query/or/
     */
    if (basicOptions.ids) {
      conditions.$or = conditions.$or || new Array<string>();
      const ids = basicOptions.ids.replace(/\s/g, '').split(',');
      for (const id of ids) {
        conditions.$or.push({
          id,
        });
      }
    }

    /*
     * Pagination: page and limit
     */
    let skip = 0;
    const sort = {};
    sort[basicOptions.sort_by] = basicOptions.sort_dir;

    if (basicOptions.page) {
      skip = (basicOptions.page - 1 /* Shopify page starts on 1 and not 0 */) * basicOptions.limit;
    }

    /**
     * Range filters like created_at / published_at / updated_at with min and max
     */
    /*
     * created_at min and max
     */
    if (basicOptions.created_at_max) {
      conditions.created_at = conditions.created_at || {};
      conditions.created_at.$lte = basicOptions.created_at_max;
    }
    if (basicOptions.created_at_min) {
      conditions.created_at = conditions.created_at || {};
      conditions.created_at.$gte = basicOptions.created_at_min;
    }

    /*
     * published_at min and max
     */
    if (basicOptions.published_at_max) {
      conditions.published_at = conditions.published_at || {};
      conditions.published_at.$lte = basicOptions.published_at_max;
    }
    if (basicOptions.published_at_min) {
      conditions.published_at = conditions.published_at || {};
      conditions.published_at.$gte = basicOptions.published_at_min;
    }

    /*
     * updated_at min and max
     */
    if (basicOptions.updated_at_max) {
      conditions.updated_at = conditions.updated_at || {};
      conditions.updated_at.$lte = basicOptions.updated_at_max;
    }
    if (basicOptions.updated_at_min) {
      conditions.updated_at = conditions.updated_at || {};
      conditions.updated_at.$gte = basicOptions.updated_at_min;
    }

    return this.dbModel(user.shop.myshopify_domain)
    .find(conditions)
    .select(fields)
    .sort(sort)
    .limit(basicOptions.limit)
    .skip(skip)
    // .lean(); // Just return the result data without mongoose methods like `.save()`
  }

  /**
   * Internal method to update or create a single `ShopifyObjectType` in the app mongodb database.
   * @param user
   * @param object The objects to create / update
   */
  public async updateOrCreateInDb(user: IShopifyConnect, conditions = {}, update: Partial<ShopifyObjectType>) {
    const model = this.dbModel(user.shop.myshopify_domain);
    return model.findOneAndUpdate(conditions, update as any, {upsert: true}); // TODO NEST7 CHECKME
  }

  /**
   * Internal method to update or create a single `ShopifyObjectType` in mongodb.
   * @param user
   * @param object The objects to create / update
   */
  public async updateOrCreateInApp(
    user: IShopifyConnect,
    selectBy = 'id',
    update: Partial<ShopifyObjectType>,
    inDb =  true,
  ) {
    this.logger.debug(`[updateOrCreateInApp:${this.resourceName}] start`);
    const promises = new Array<Promise<any>>();
    if (inDb) {
      const conditions = {};
      conditions[selectBy] = update[selectBy];
      promises.push(this.updateOrCreateInDb(user, conditions, update));
    }
    return Promise.all(promises)
    .then((_) => {
      this.logger.debug(`[updateOrCreateInApp:${this.resourceName}] done`);
      return _;
    });
  }

  /**
   * Internal method to update several `ShopifyObjectType` in the app mongodb database.
   * @param user
   * @param objects The objects to create / update
   */
  protected async updateOrCreateManyInDb(
    user: IShopifyConnect,
    selectBy: string,
    objects: Partial<ShopifyObjectType>[],
  ) {
    this.logger.debug(`[updateOrCreateManyInDb:${this.resourceName}] start selectBy: ${selectBy} objects.length: ${objects.length}`);
    // An empty bulkwrite is not allowed. Just return an empty object if the passed array is empty.
    if (objects.length === 0) {
      return {};
    }
    const model = this.dbModel(user.shop.myshopify_domain);
    const result = await model.bulkWrite(
      objects.map((object: ShopifyObjectType) => {
        return {
          replaceOne: {
            filter: {
              id: object[selectBy],
            },
            replacement: object,
            upsert: true,
          },
        };
      }),
      {}
    );

    this.logger.debug(`[updateOrCreateManyInDb:${this.resourceName}] done result: ${result}`);
    return result;
  }

  /**
   *
   * @param user
   * @param selectBy
   * @param objects
   */
  public async updateOrCreateManyInApp(
    user: IShopifyConnect,
    selectBy = 'id',
    objects: ShopifyObjectType[],
    inDb = false,
  ): Promise<Partial<BulkWriteOpResultObject[]>> {
    this.logger.debug(
      `[updateOrCreateManyInApp:${this.resourceName}] start inDb: ${inDb} objects.length: ${objects.length}`,
    );
    const promises = new Array<Promise<any>>();

    if (inDb) {
      promises.push(this.updateOrCreateManyInDb(user, selectBy, objects));
    }

    return Promise.all(promises)
    .then((_) => {
      this.logger.debug(`[updateOrCreateManyInApp:${this.resourceName}] done`);
      return _;
    });
  }
}