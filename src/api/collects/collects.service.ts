import { Inject, Injectable } from '@nestjs/common';
import { EventService } from '../../event.service';
import { ShopifyApiRootCountableService } from '../shopify-api-root-countable.service';

// Interfaces
import { Model } from 'mongoose';
import { Collects, Interfaces } from 'shopify-admin-api';
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
  Resource,
  ShopifyModuleOptions,
} from '../../interfaces';
import { IListAllCallbackData } from '../../api/interfaces';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { mongooseParallelRetry } from '../../helpers';
import { SHOPIFY_MODULE_OPTIONS } from '../../shopify.constants';

@Injectable()
export class CollectsService extends ShopifyApiRootCountableService<
  Interfaces.Collect, // ShopifyObjectType
  Collects, // ShopifyModelClass
  IShopifySyncCollectCountOptions, // CountOptions
  IShopifySyncCollectGetOptions, // GetOptions
  IShopifySyncCollectListOptions, // ListOptions
  CollectDocument // DatabaseDocumentType
  > {

  resourceName: Resource = 'collects';
  subResourceNames: Resource[] = [];

  constructor(
    @Inject('CollectModelToken')
    private readonly collectModel: (shopName: string) => Model<CollectDocument>,
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
    @Inject(SHOPIFY_MODULE_OPTIONS) protected readonly shopifyModuleOptions: ShopifyModuleOptions,
  ) {
    super(collectModel, Collects, eventService, syncProgressModel, shopifyModuleOptions);
  }
}
