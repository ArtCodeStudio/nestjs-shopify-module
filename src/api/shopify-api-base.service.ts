import { IShopifyConnect } from '../auth/interfaces/connect';
import { Infrastructure, Options } from 'shopify-prime';
import { DebugService } from '../debug.service';
import { EventService } from '../event.service';
import { Model, Document } from 'mongoose';
import { BulkWriteOpResultObject } from 'mongodb';

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