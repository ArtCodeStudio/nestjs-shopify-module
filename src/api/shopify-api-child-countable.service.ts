// Third party
import { Infrastructure, Options } from 'shopify-prime';
import * as pRetry from 'p-retry';
import { Document } from 'mongoose';

import { IShopifyConnect } from '../auth/interfaces';
import { SyncOptions, ShopifyBaseObjectType, ChildCount, ChildGet, ChildList } from './interfaces';
import { deleteUndefinedProperties } from './helpers';
import { ShopifyApiChildService } from './shopify-api-child.service';

export abstract class ShopifyApiChildCountableService<
  ShopifyObjectType extends ShopifyBaseObjectType,
  ShopifyModelClass extends Infrastructure.BaseService & ChildCount<CountOptions> & ChildGet<ShopifyObjectType, GetOptions> & ChildList<ShopifyObjectType, ListOptions>,
  CountOptions extends object = {},
  GetOptions extends SyncOptions = SyncOptions,
  ListOptions extends CountOptions & SyncOptions & Options.BasicListOptions = CountOptions & SyncOptions & Options.BasicListOptions,
  DatabaseDocumentType extends Document = ShopifyObjectType & Document,
> extends ShopifyApiChildService<
  ShopifyObjectType,
  ShopifyModelClass,
  GetOptions,
  ListOptions,
  DatabaseDocumentType
> {

  public async countFromShopify(shopifyConnect: IShopifyConnect, parentId: number): Promise<number>
  public async countFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options: CountOptions): Promise<number>
  public async countFromShopify(shopifyConnect: IShopifyConnect, parentId: number, options?: CountOptions): Promise<number> {
    const shopifyModel = new this.ShopifyModel(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    // Delete undefined options
    deleteUndefinedProperties(options);
    return pRetry(() => {
      return shopifyModel.count(parentId, options);
    });
  }

}
