import { Inject, Injectable } from '@nestjs/common';
import { EventService } from '../../event.service';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';

// Interfaces
import { Model } from 'mongoose';
import { Collect } from 'shopify-admin-api/dist/models';
import { Collects } from 'shopify-admin-api';
import {
  CollectDocument,
  IShopifySyncCollectCountOptions,
  IShopifySyncCollectGetOptions,
  IShopifySyncCollectListOptions,
  IAppCollectCountOptions,
  IAppCollectGetOptions,
  IAppCollectListOptions,
} from '../interfaces';
import { SyncProgressDocument,
  IStartSyncOptions,
  OrderSyncProgressDocument,
} from '../../interfaces';
import { IListAllCallbackData } from '../../api/interfaces';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { mongooseParallelRetry } from '../../helpers';

@Injectable()
export class CollectsService extends ShopifyApiRootCountableService<
  Collect, // ShopifyObjectType
  Collects, // ShopifyModelClass
  IShopifySyncCollectCountOptions, // CountOptions
  IShopifySyncCollectGetOptions, // GetOptions
  IShopifySyncCollectListOptions, // ListOptions
  CollectDocument // DatabaseDocumentType
  > {

  resourceName = 'collects';
  subResourceNames = [];

  constructor(
    @Inject('CollectModelToken')
    private readonly collectModel: (shopName: string) => Model<CollectDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
  ) {
    super(collectModel, Collects, eventService, syncProgressModel);
  }
}
