// Third party
import { BulkWriteOpResultObject } from 'mongodb';
import { Model, Document, Mongoose, Query as MongooseQuery} from 'mongoose';
import { Infrastructure, Options } from 'shopify-prime';
import {
  SearchResponse as ESSearchResponse,
  CountResponse as ESCountResponse,
  GenericParams as ESGenericParams,
  GetResponse as ESGetResponse,
  CreateDocumentResponse as ESCreateDocumentResponse,
  CreateDocumentParams as ESCreateDocumentParams,
  UpdateDocumentParams as ESUpdateDocumentParams,
} from 'elasticsearch';

import { IShopifyConnect } from '../auth/interfaces';
import { ShopifyModuleOptions } from '../interfaces';
import {
  IESResponseError,
  IAppBasicListOptions,
} from './interfaces';
import { DebugService } from '../debug.service';
import { EventService } from '../event.service';
import { ElasticsearchService } from '../elasticsearch.service';
import { BulkIndexDocumentsParams } from 'elasticsearch';
import { firstCharUppercase, underscoreCase, deleteUndefinedProperties } from '../helpers';

export abstract class ShopifyApiBaseService<
    ShopifyObjectType,
    ShopifyModelClass extends Infrastructure.BaseService,
    DatabaseDocumentType extends Document,
  > {

  protected logger = new DebugService(`shopify:${this.constructor.name}`);
  abstract resourceName: string; // resource name: 'orders', 'products', etc.

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
    protected readonly esService: ElasticsearchService,
    protected readonly dbModel: (shopName: string) => Model<DatabaseDocumentType>,
    protected readonly ShopifyModel: new (shopDomain: string, accessToken: string) => ShopifyModelClass,
    protected readonly events: EventService,
  ) {
  }

  /**
   * Retrieves a single `ShopifyObjectType` from the app's mongodb database.
   * @param user
   * @param id
   */
  async getFromDb(user: IShopifyConnect, conditions): Promise<ShopifyObjectType | null> {
    return this.dbModel(user.shop.myshopify_domain).findOne(conditions).select('-_id -__v').lean();
  }

  /**
   * Retrieves a single `ShopifyObjectType` from elasticsearch by the elasticsearch `_id` (not the shopify object id).
   * @param user
   * @param id
   */
  protected async _getFromEs(user: IShopifyConnect, id: string): Promise<ESGetResponse<ShopifyObjectType>> {
    return this.esService.client.get({
      index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
      type: 'doc',
      id,
    });
  }

  /**
   * Retrieves a list of `ShopifyObjectType` from elasticsearch.
   * @param user
   * @param id
   */
  protected async _searchInEs(user: IShopifyConnect, body: ESGenericParams['body']) {

    if (Object.keys(body.query.range).length === 0) {
      delete body.query.range;
    }

    // If query is empty match all
    if (Object.keys(body.query).length === 0) {
      body.query = {
        match_all: {},
      };
    }

    return this.esService.client.search({
      index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
      body,
    })
    .catch((error: IESResponseError) => {
      if (typeof(error.body) === 'string' && error.response.charAt(0) === '{') {
        error.body = JSON.parse(error.body);
      }
      if (typeof(error.response) === 'string' && error.response.charAt(0) === '{') {
        error.response = JSON.parse(error.response);
      }
      this.logger.error(error);
      throw error;
    });
  }

  /**
   * Retrieves a single `ShopifyObjectType` from elasticsearch by ShopifyObjectType id (not the elasticsearch `_id`)
   * @param user
   * @param id
   */
  public async getFromEs(user: IShopifyConnect, id: number): Promise<ShopifyObjectType | null> {
    return this._searchInEs(user, {
      query: {
        match: {
          id,
        },
      },
    })
    .then((searchResponse) => {
      if (searchResponse.hits.total === 0) {
        return null;
      }
      return searchResponse.hits[0].hits._source;
    });
  }

  /**
   * Retrieves a count of `ShopifyObjectType` from the app's mongodb database.
   * @param user
   * @param options
   */
  async countFromDb(user: IShopifyConnect, conditions = {}): Promise<number> {
    return this.dbModel(user.shop.myshopify_domain)
    .find(conditions)
    .countDocuments(conditions);
  }

  /**
   * Retrieves a count of `ShopifyObjectType` from elasticsearch.
   * @param user
   * @param options
   */
  protected async _countFromEs(user: IShopifyConnect, body: ESGenericParams['body'] = {query: {match_all: {}}}): Promise<ESCountResponse> {
    return this.esService.client.count({
      index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
      body,
    });
  }

  /**
   * Retrieves a count of `ShopifyObjectType` from elasticsearch.
   * @param user
   * @param options
   */
  public async countFromSearch(user: IShopifyConnect, body: ESGenericParams['body'] = {query: {match_all: {}}}): Promise<number> {
    return this._countFromEs(user, body)
    .then((coutResult) => {
      return coutResult.count;
    });
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
    ): Promise<ShopifyObjectType[]> {

    basicOptions = this.setDefaultAppListOptions(basicOptions);

    /**
     * Just return the specified `fields` or removes mongodb internally _id and __v properties from result
     */
    const fields: any = {};

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
        fields._id = 0;
        fields.__v = 0;
      }
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
    .lean(); // Just return the result data without mongoose methods like `.save()`
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
  public queryDb(shopifyConnect: IShopifyConnect, conditions = {}): MongooseQuery<ShopifyObjectType> {
    return this.dbModel(shopifyConnect.shop.myshopify_domain)
    .find(conditions)
    .select('-_id -__v') // Removes :id and __v properties from result
    .lean(); // Just return the result data without mongoose methods like `.save()`
  }

  /**
   * Retrieves a list of `ShopifyObjectType` from elasticsearch.
   * @param user
   * @param body see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html
   */
  public async listFromSearch(
    user: IShopifyConnect,
    body: ESGenericParams['body'] = {query: {match_all: {}}},
    basicOptions: IAppBasicListOptions,
  ): Promise<ShopifyObjectType[]> {

    basicOptions = this.setDefaultAppListOptions(basicOptions);

    // @see https://stackoverflow.com/a/40755927/1465919
    const and = []; // ~ query.bool.must = []
    const or = []; // ~ query.bool.must[x].bool.should = []

    /**
     * Sort the result
     * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-sort.html
     */
    const sortList = [];
    const sort = {};
    sort[basicOptions.sort_by] = basicOptions.sort_dir;
    sortList.push(sort);

    /**
     * Just return the specified `fields`
     * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-source-filtering.html
     */
    let _source: boolean | string[] = true;

    // Convert fields to ES fields
    if (basicOptions.fields) {
      _source = basicOptions.fields.replace(/\s/g, '').split(',');
    }

    /**
     * Filter by ids
     * * `OR` is spelled `should`
     * * `AND` is spelled `must`
     * * `NOR` is spelled `should_not`
     * @see https://stackoverflow.com/a/40755927/1465919
     */
    if (basicOptions.ids) {
      const ids = basicOptions.ids.replace(/\s/g, '').split(',');
      for (const id of ids) {
        or.push({
          term: {
            id,
          },
        });
      }
    }

    /**
     * Pagination like limit and page
     * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-from-size.html
     */
    let size = 250;
    let from = 0;

    // Convert limit to ES limit
    if (basicOptions.limit) {
      size = basicOptions.limit;
    }

    if (basicOptions.page) {
      from = (basicOptions.page - 1 /* Shopify page starts on 1 and not 0 */) * size;
    }

    /**
     * Range filters like created_at / published_at / updated_at with min and max
     * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-range-query.html
     */
    body.query.range = body.query.range || {};

    /*
     * created_at min and max
     */
    if (basicOptions.created_at_max) {
      body.query.range.created_at = body.query.range.created_at || {};
      body.query.range.created_at = {
        lte: basicOptions.created_at_max,
      };
    }
    if (basicOptions.created_at_min) {
      body.query.range.created_at = body.query.range.created_at || {};
      body.query.range.created_at = {
        gte: basicOptions.created_at_min,
      };
    }

    /*
     * published_at min and max
     */
    if (basicOptions.published_at_max) {
      body.query.range.published_at = body.query.range.published_at || {};
      body.query.range.published_at.lte = basicOptions.published_at_max;
    }
    if (basicOptions.published_at_min) {
      body.query.range.published_at = body.query.range.published_at || {};
      body.query.range.published_at.gte = basicOptions.published_at_min;
    }

    /*
     * updated_at min and max
     */
    if (basicOptions.updated_at_max) {
      body.query.range.updated_at = body.query.range.updated_at || {};
      body.query.range.updated_at.lte = basicOptions.updated_at_max;
    }
    if (basicOptions.updated_at_min) {
      body.query.range.updated_at = body.query.range.updated_at || {};
      body.query.range.updated_at.gte = basicOptions.updated_at_min;
    }

    body._source = _source;
    body.size = size;
    body.from = from;
    body.sort = sortList;

    // Set or filter to query (as parent of the and filter)
    if (or.length > 0) {
      and.push({
        bool: {
          should: or,
        },
      });
    }

    // Set and filter to query
    if (and.length > 0) {
      body.query.bool = body.query.bool || {};
      body.query.bool.must = and;
    }

    this.logger.debug(`[listFromSearch:${this.resourceName}]`, user.shop.myshopify_domain);
    return this._searchInEs(user, body)
    .then((response: ESSearchResponse<ShopifyObjectType>) => {
      return response.hits.hits.map((value) => {
        return value._source;
      });
    });
  }

  /**
   * Internal method to update or create a single `ShopifyObjectType` in the app mongodb database.
   * @param user
   * @param object The objects to create / update
   */
  public async updateOrCreateInDb(user: IShopifyConnect, conditions = {}, update: Partial<ShopifyObjectType>) {
    const model = this.dbModel(user.shop.myshopify_domain);
    return model.findOneAndUpdate(conditions, update, {upsert: true});
  }

  /**
   * Internal method to update or create a single `ShopifyObjectType` in mongodb AND / OR elasticsearch.
   * @param user
   * @param object The objects to create / update
   */
  public async updateOrCreateInApp(
    user: IShopifyConnect,
    selectBy: string = 'id',
    update: Partial<ShopifyObjectType>,
    inDb: boolean =  true,
    inSearch: boolean = false,
  ) {
    this.logger.debug(`[updateOrCreateInApp:${this.resourceName}] start`);
    const promises = new Array<Promise<any>>();
    if (inSearch) {
      promises.push(this.updateOrCreateInSearch(user, selectBy, update));
    }
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
   * Internal method to create a single `ShopifyObjectType` in elasticsearch.
   * @param user
   * @param object The objects to create
   */
  protected async updateOrCreateInSearch(user: IShopifyConnect, selectBy: string = 'id', createOrCreate: Partial<ShopifyObjectType>) {
    if (createOrCreate[selectBy]) {
      const updateDocumentParams: ESUpdateDocumentParams = {
        index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
        type: 'doc',
        id: createOrCreate[selectBy],
        body: {
          doc: createOrCreate,
          doc_as_upsert: true,
        },
      };
      return this.esService.client.update(updateDocumentParams);
    }

    const createDocumentParams: ESCreateDocumentParams = {
      index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
      type: 'doc',
      id: (createOrCreate as any).id, // FIXME
      body: createOrCreate,
    };
    return this.esService.client.create(createDocumentParams);
  }

  /**
   * Internal method to update several `ShopifyObjectType` in the app mongodb database.
   * @param user
   * @param objects The objects to create / update
   */
  public async updateOrCreateManyInDb(user: IShopifyConnect, selectBy: string, objects: ShopifyObjectType[]): Promise<BulkWriteOpResultObject | {}> {
    this.logger.debug(`[updateOrCreateManyInDb:${this.resourceName}] start selectBy: ${selectBy} objects.length: ${objects.length}`);
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
              id: object[selectBy],
            },
            replacement: object,
            upsert: true,
          },
        };
      }),
    )
    .then((result) => {
      this.logger.debug(`[updateOrCreateManyInDb:${this.resourceName}] done result: ${result}`);
      return result;
    });
  }

  /**
   * TODO use bulk api: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
   * @param user
   * @param selectBy
   * @param objects
   */
  public async updateOrCreateManyInSearch(user: IShopifyConnect, selectBy: string, objects: ShopifyObjectType[]): Promise<any> {
    const _index = this.esService.getIndex(user.shop.myshopify_domain, this.resourceName);
    const bulkActions = [];
    objects.forEach((object) => {
      const action = {
        update: {
          _index,
          _type: 'doc',
          _id: object[selectBy],
        },
      };
      bulkActions.push(action, { doc: object, doc_as_upsert: true });
    });
    const bulkParams: BulkIndexDocumentsParams = {
      body: bulkActions,
    };
    this.logger.debug(`[updateOrCreateManyInSearch:${this.resourceName}] start selectBy: ${selectBy} objects.length: ${objects.length}`);
    return this.esService.client.bulk(bulkParams)
    .then((result) => {
      this.logger.debug(`[updateOrCreateManyInSearch:${this.resourceName}] done`);
      return result;
    });
  }

  /**
   *
   * @param user
   * @param selectBy
   * @param objects
   */
  public async updateOrCreateManyInApp(
    user: IShopifyConnect,
    selectBy: string = 'id',
    objects: ShopifyObjectType[],
    inDb: boolean = false,
    inSearch: boolean = false,
  ): Promise<BulkWriteOpResultObject | {}> {
    this.logger.debug(`[updateOrCreateManyInApp:${this.resourceName}] start inDb: ${inDb} inSearch: ${inSearch} objects.length: ${objects.length}`);
    const promises = new Array<Promise<any>>();

    if (inSearch) {
      promises.push(this.updateOrCreateManyInSearch(user, selectBy, objects));
    }

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