import { Inject, Injectable } from '@nestjs/common';
import { CustomCollections, Options } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime
import { CustomCollection } from 'shopify-prime/models';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { CustomCollectionDocument } from '../interfaces/mongoose/custom-collection.schema';
import { SyncProgressDocument } from '../../interfaces';
import { Model } from 'mongoose';
import { EventService } from '../../event.service';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';

export interface CustomCollectionListOptions extends Options.CollectionListOptions {
  sync?: boolean;
  failOnSyncError?: boolean;
}

export interface CustomCollectionGetOptions extends Options.FieldOptions {
  sync?: boolean;
}

export interface CustomCollectionCountOptions extends Options.DateOptions, Options.PublishedOptions {
  title?: string,
  product_id?: number,
} 

@Injectable()
export class CustomCollectionsService extends ShopifyApiRootCountableService<
CustomCollection, // ShopifyObjectType
CustomCollections, // ShopifyModelClass
CustomCollectionCountOptions, // CountOptions
CustomCollectionGetOptions, // GetOptions
CustomCollectionListOptions, // ListOptions
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
