import { Inject, Injectable } from '@nestjs/common';
import { CustomCollections, Options } from 'shopify-admin-api'; // https://github.com/nozzlegear/Shopify-Prime
import { CustomCollection } from 'shopify-admin-api/dist/models';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { SyncProgressDocument } from '../../interfaces';
import { Model } from 'mongoose';
import { EventService } from '../../event.service';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';
import { ElasticsearchService } from '../../elasticsearch.service';
import { SwiftypeService } from '../../swiftype.service';

import {
  CustomCollectionDocument,
  IShopifySyncCustomCollectionCountOptions,
  IShopifySyncCustomCollectionGetOptions,
  IShopifySyncCustomCollectionListOptions,
} from '../interfaces';

@Injectable()
export class CustomCollectionsService extends ShopifyApiRootCountableService<
CustomCollection, // ShopifyObjectType
CustomCollections, // ShopifyModelClass
IShopifySyncCustomCollectionCountOptions, // CountOptions
IShopifySyncCustomCollectionGetOptions, // GetOptions
IShopifySyncCustomCollectionListOptions, // ListOptions
CustomCollectionDocument // DatabaseDocumentType
> {

  resourceName = 'customCollections';
  subResourceNames = [];

  constructor(
    protected readonly esService: ElasticsearchService,
    @Inject('CustomCollectionModelToken')
    private readonly customCollectionModel: (shopName: string) => Model<CustomCollectionDocument>,
    protected readonly swiftypeService: SwiftypeService,
    @Inject('SyncProgressModelToken')
    private readonly eventService: EventService,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
  ) {
    super(esService, customCollectionModel, swiftypeService, CustomCollections, eventService, syncProgressModel);
  }
}
