// nest
import { Inject, Injectable } from '@nestjs/common';

// Third party
import { shopifyRetry } from '../../helpers';

import { IShopifyConnect } from '../../auth/interfaces';
import { AccessScopes } from 'shopify-admin-api';
import { Interfaces } from 'shopify-admin-api';
import { Model } from 'mongoose';
import { AccessScopeDocument } from '../interfaces';

import { EventService } from '../../event.service';
import { Resource } from '../../interfaces';

@Injectable()
export class AccessScopesService {
  resourceName: Resource = 'accessScopes';
  subResourceNames: Resource[] = [];

  constructor(
    @Inject('AccessScopeModelToken')
    protected readonly accessScopeModel: (
      shopName: string,
    ) => Model<AccessScopeDocument>,
    protected readonly eventService: EventService,
  ) {}

  /**
   * Retrieves a list of `ShopifyObjectType[]` directly from shopify.
   * @param user
   * @param options
   */
  public async listFromShopify(
    shopifyConnect: IShopifyConnect,
  ): Promise<Partial<Interfaces.Checkout>[]> {
    const shopifyAccessScopeModel = new AccessScopes(
      shopifyConnect.myshopify_domain,
      shopifyConnect.accessToken,
    );
    return shopifyRetry(() => {
      return shopifyAccessScopeModel.list();
    });
  }
}
