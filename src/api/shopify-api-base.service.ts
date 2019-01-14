// Third party
import { BulkWriteOpResultObject } from 'mongodb';
import { Model, Document } from 'mongoose';
import { Infrastructure, Options } from 'shopify-prime';
import { Client as ESClient, SearchResponse as ESSearchResponse, CountResponse as ESCountResponse, GenericParams as ESGenericParams } from 'elasticsearch';

import { IShopifyConnect } from '../auth/interfaces';
import { ShopifyModuleOptions } from '../interfaces';
import { DebugService } from '../debug.service';
import { EventService } from '../event.service';
import { ElasticsearchService } from '../elasticsearch.service';

export abstract class ShopifyApiBaseService<
    ShopifyObjectType,
    ShopifyModelClass extends Infrastructure.BaseService,
    DatabaseDocumentType extends Document,
  > {

  protected logger = new DebugService(`shopify:${this.constructor.name}`);
  abstract resourceName: string; // resource name: 'orders', '`ShopifyObjectType`', etc.
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
   * Retrieves a single `ShopifyObjectType` from the app's elasticsearch.
   * @param user 
   * @param id 
   */
  protected async _getFromEs(user: IShopifyConnect, body: ESGenericParams['body']): Promise<ESSearchResponse<ShopifyObjectType>> {
    return this.esService.search({
      index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
      body,
    });
  }

  public async getFromEs(user: IShopifyConnect, id: number): Promise<ShopifyObjectType | null> {
    return this._getFromEs(user, {
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
    return this.esService.count({
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
  async listFromDb(user: IShopifyConnect, conditions = {}): Promise<ShopifyObjectType[]> {
    return this.dbModel(user.shop.myshopify_domain).find(conditions).select('-_id -__v').lean();
  }

  /**
   * Retrieves a list of `ShopifyObjectType` from elasticsearch.
   * @param user 
   * @param body see https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html
   */
  async listFromEs(user: IShopifyConnect, body: ESGenericParams['body'] = {query: {"match_all": {}}}): Promise<ShopifyObjectType[]> {
    this.logger.debug('listFromEs', this.esService.getIndex(user.shop.myshopify_domain, this.resourceName));
    return this.esService.search({
      index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
      body: body,
    })
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
  async updateOrCreateInDb(user: IShopifyConnect, conditions = {}, update: Partial<ShopifyObjectType>) {
    const model = this.dbModel(user.shop.myshopify_domain);
    return model.findOneAndUpdate(conditions, update, {upsert: true});
  }

  async updateOrCreateInEs(user: IShopifyConnect, update: Partial<ShopifyObjectType>) {
    if ((update as any).id) {
      return this._updateInEs(user, (update as any).id, update);
    }
    return this._createInEs(user, update);
  }

  protected async _createInEs(user: IShopifyConnect, create: Partial<ShopifyObjectType>) {
    const shopName = user.shop.myshopify_domain.replace('.myshopify.com', '');
    return this.esService.create({
      index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
      type: 'doc',
      body: create,
    });
  }

  protected async _updateInEs(user: IShopifyConnect, id: string, update: Partial<ShopifyObjectType>) {
    const shopName = user.shop.myshopify_domain.replace('.myshopify.com', '');
    this._getFromEs(user, {
      query: {
        match: {
          id,
        }
      },
    })
    .then((value) => {
      const _id = value.hits.hits[0]._id;
      return this.esService.update({
        index: this.esService.getIndex(user.shop.myshopify_domain, this.resourceName),
        type: 'doc',
        id: _id,
        body: {
          doc: update,
        },
      })
    });
  }

  /**
   * Internal method to update several `ShopifyObjectType` in the app mongodb database.
   * @param user 
   * @param objects The objects to create / update
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