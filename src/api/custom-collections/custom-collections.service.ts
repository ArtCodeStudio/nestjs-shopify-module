import { Inject, Injectable } from '@nestjs/common';
import { CustomCollections, Options, Interfaces } from 'shopify-admin-api'; // https://github.com/ArtCodeStudio/shopify-admin-api
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { SyncProgressDocument } from '../../interfaces';
import { Model } from 'mongoose';
import { EventService } from '../../event.service';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';

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

  resourceName = 'customCollections';
  subResourceNames = [];

  constructor(
    @Inject('CustomCollectionModelToken')
    private readonly customCollectionModel: (shopName: string) => Model<CustomCollectionDocument>,
    @Inject('SyncProgressModelToken')
    private readonly eventService: EventService,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
  ) {
    super(customCollectionModel, CustomCollections, eventService, syncProgressModel);
  }
}
