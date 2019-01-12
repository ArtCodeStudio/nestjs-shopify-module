import { Inject, Injectable } from '@nestjs/common';
import { SmartCollections, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { SmartCollection } from 'shopify-prime/models';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { SmartCollectionDocument } from '../interfaces/mongoose/smart-collection.schema';
import { SyncProgressDocument } from '../../interfaces';
import { Model } from 'mongoose';
import { EventService } from '../../event.service';
import { ShopifyApiRootCountableService } from '../api.service';

export interface SmartCollectionListOptions extends Options.CollectionListOptions {
  sync?: boolean;
  failOnSyncError?: boolean;
}

export interface SmartCollectionGetOptions extends Options.FieldOptions {
  sync?: boolean;
}

export interface SmartCollectionCountOptions extends Options.DateOptions, Options.PublishedOptions {
  title?: string,
  product_id?: number,
} 

@Injectable()
export class SmartCollectionsService extends ShopifyApiRootCountableService<
SmartCollection, // ShopifyObjectType
SmartCollections, // ShopifyModelClass
SmartCollectionCountOptions, // CountOptions
SmartCollectionGetOptions, // GetOptions
SmartCollectionListOptions, // ListOptions
SmartCollectionDocument // DatabaseDocumentType
> {

  resourceName = 'smartCollections';
  subResourceNames = [];

  constructor(
    @Inject('SmartCollectionModelToken')
    private readonly smartCollectionModel: (shopName: string) => Model<SmartCollectionDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    private readonly eventService: EventService,
  ) {
    super(smartCollectionModel, SmartCollections, eventService, syncProgressModel);
  }
}
