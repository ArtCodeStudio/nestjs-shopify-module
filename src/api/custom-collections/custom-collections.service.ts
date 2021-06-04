import { Inject, Injectable } from '@nestjs/common';
import { CustomCollections, Interfaces } from 'shopify-admin-api'; // https://github.com/ArtCodeStudio/shopify-admin-api
import {
  SyncProgressDocument,
  Resource,
  ShopifyModuleOptions,
} from '../../interfaces';
import { Model } from 'mongoose';
import { EventService } from '../../event.service';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';
import { SHOPIFY_MODULE_OPTIONS } from '../../shopify.constants';

import {
  CustomCollectionDocument,
  IShopifySyncCustomCollectionCountOptions,
  IShopifySyncCustomCollectionGetOptions,
  IShopifySyncCustomCollectionListOptions,
} from '../interfaces';

@Injectable()
export class CustomCollectionsService extends ShopifyApiRootCountableService<
  Interfaces.CustomCollection, // ShopifyObjectType
  CustomCollections, // ShopifyModelClass
  IShopifySyncCustomCollectionCountOptions, // CountOptions
  IShopifySyncCustomCollectionGetOptions, // GetOptions
  IShopifySyncCustomCollectionListOptions, // ListOptions
  CustomCollectionDocument // DatabaseDocumentType
> {
  resourceName: Resource = 'customCollections';
  subResourceNames: Resource[] = [];

  constructor(
    @Inject('CustomCollectionModelToken')
    private readonly customCollectionModel: (
      shopName: string,
    ) => Model<CustomCollectionDocument>,
    @Inject('SyncProgressModelToken')
    private readonly eventService: EventService,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    protected readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
    super(
      customCollectionModel,
      CustomCollections,
      eventService,
      syncProgressModel,
      shopifyModuleOptions,
    );
  }
}
