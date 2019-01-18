// Third party
import { BulkWriteOpResultObject } from 'mongodb';
import { Model, Document } from 'mongoose';
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
import { IESResponseError } from './interfaces'
import { DebugService } from '../debug.service';
import { EventService } from '../event.service';
import { ElasticsearchService } from '../elasticsearch.service';
import { firstCharUppercase, underscoreCase } from '../helpers'

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
    return this.esService.client.search({
      index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
      body,
    })
    // .catch((error: IESResponseError) => {
    //   error.body = JSON.parse(error.body);
    //   error.response = JSON.parse(error.response);
    //   throw error;
    // })
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
        }
      },
    })
    .then((searchResponse) => {
      if (searchResponse.hits.total === 0) {
        return null;
      }
      return searchResponse.hits[0].hits._source;
    })
  }

  /**
   * Retrieves a count of `ShopifyObjectType` from the app's mongodb database.
   * @param user 
   * @param options 
   */
  async countFromDb(user: IShopifyConnect, conditions = {}): Promise<number> {
    return this.dbModel(user.shop.myshopify_domain).count(conditions);
  }

  /**
   * Retrieves a count of `ShopifyObjectType` from elasticsearch.
   * @param user 
   * @param options 
   */
  protected async _countFromEs(user: IShopifyConnect, body: ESGenericParams['body'] = {query: {"match_all": {}}}): Promise<ESCountResponse> {
    const shopName = user.shop.myshopify_domain.replace('.myshopify.com', '');
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
  public async countFromEs(user: IShopifyConnect, body: ESGenericParams['body'] = {query: {"match_all": {}}}): Promise<number> {
    return this._countFromEs(user, body)
    .then((coutResult) => {
      return coutResult.count;
    });
  }

  /**
   * Retrieves a list of `ShopifyObjectType` from the app's mongodb database.
   * @param user 
   */
  public async listFromDb(user: IShopifyConnect, conditions = {}): Promise<ShopifyObjectType[]> {
    return this.dbModel(user.shop.myshopify_domain).find(conditions).select('-_id -__v').lean();
  }

  /**
   * Retrieves a list of `ShopifyObjectType` from elasticsearch.
   * @param user 
   * @param body see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html
   */
  public async listFromSearch(user: IShopifyConnect, body: ESGenericParams['body'] = {query: {"match_all": {}}}, basicOptions: Options.FieldOptions & Options.BasicListOptions & Options.DateOptions & Options.PublishedOptions): Promise<ShopifyObjectType[]> {
    
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-source-filtering.html
    let _source: boolean | string[] = true;

    // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-from-size.html
    let size = 250;
    let from = 0

    // Convert fields to ES fields
    if (basicOptions.fields) {
      _source = basicOptions.fields.split(',');
    }

    // Convert limit to ES limit
    if (basicOptions.limit) {
      size = basicOptions.limit || 250;
      if (size > 250 || size <= 0) {
        size = 250
      }
    }

    if (basicOptions.page) {
      from = basicOptions.page * size;
    }

    const range: any = {}

    if (basicOptions.created_at_max) {
      range.created_at_max = {
        lte: basicOptions.created_at_max,
      }
    }

    if (basicOptions.created_at_min) {
      range.created_at_min = {
        gte: basicOptions.created_at_min,
      }
    }

    body._source = _source;
    body.size = size;
    body.from = from;

    if (Object.keys(range).length) {
      body.query.rage = range;
    }
    
    this.logger.debug(`[listFromSearch:${this.resourceName}]`, user.shop.myshopify_domain);
    return this._searchInEs(user, body)
    .then((value: ESSearchResponse<ShopifyObjectType>) => {
      return value.hits.hits.map((value) => {
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
  public async updateOrCreateInApp(user: IShopifyConnect, selectBy: string = 'id', update: Partial<ShopifyObjectType>, inDb: boolean =  true, inSearch: boolean = false) {
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
    })
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
      }
      return this.esService.client.update(updateDocumentParams);
    }

    const createDocumentParams: ESCreateDocumentParams = {
      index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
      type: 'doc',
      id: createOrCreate['id'],
      body: createOrCreate,
    }
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
              id: object[selectBy]
            },
            replacement: object,
            upsert: true,
          }
        }
      })
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
  public async updateOrCreateManyInSearch(user: IShopifyConnect, selectBy: string, objects: ShopifyObjectType[]): Promise<BulkWriteOpResultObject | {}> {
    this.logger.debug(`[updateOrCreateManyInSearch:${this.resourceName}] start selectBy: ${selectBy} objects.length: ${objects.length}`);
    const promises = new Array<Promise<void | ESCreateDocumentResponse>>();
    objects.forEach((object) => {
      promises.push(this.updateOrCreateInSearch(user, selectBy, object));
    });
    return Promise.all(promises)
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
  public async updateOrCreateManyInApp(user: IShopifyConnect, selectBy: string = 'id', objects: ShopifyObjectType[], inDb: boolean =  true, inSearch: boolean = false): Promise<BulkWriteOpResultObject | {}> {
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
    })
  }
}