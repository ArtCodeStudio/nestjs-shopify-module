import { Inject, Injectable } from "@nestjs/common";
import { SmartCollections, Interfaces, Options } from "shopify-admin-api"; // https://github.com/ArtCodeStudio/shopify-admin-api
import { IShopifyConnect } from "../../auth/interfaces/connect";
import { SmartCollectionDocument, IListAllCallbackData } from "../interfaces";
import {
  SyncProgressDocument,
  SubSyncProgressDocument,
  IStartSyncOptions,
  ShopifyModuleOptions,
  Resource,
} from "../../interfaces";
import { Model } from "mongoose";
import { EventService } from "../../event.service";
import { ShopifyApiRootCountableService } from "../shopify-api-root-countable.service";
import { SHOPIFY_MODULE_OPTIONS } from "../../shopify.constants";

@Injectable()
export class SmartCollectionsService extends ShopifyApiRootCountableService<
  Interfaces.SmartCollection, // ShopifyObjectType
  SmartCollections, // ShopifyModelClass
  Options.CollectionCountOptions, // CountOptions
  Options.CollectionGetOptions, // GetOptions
  Options.CollectionListOptions, // ListOptions
  SmartCollectionDocument // DatabaseDocumentType
> {
  resourceName: Resource = "smartCollections";
  subResourceNames: Resource[] = [];

  constructor(
    @Inject("SmartCollectionModelToken")
    private readonly smartCollectionModel: (
      shopName: string
    ) => Model<SmartCollectionDocument>,
    @Inject("SyncProgressModelToken")
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    private readonly eventService: EventService,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    protected readonly shopifyModuleOptions: ShopifyModuleOptions
  ) {
    super(
      smartCollectionModel,
      SmartCollections,
      eventService,
      syncProgressModel,
      shopifyModuleOptions
    );
  }

  /**
   *
   * @param shopifyConnect
   * @param subProgress
   * @param options
   * @param data
   */
  async syncedDataCallback(
    shopifyConnect: IShopifyConnect,
    progress: SyncProgressDocument,
    subProgress: SubSyncProgressDocument,
    options: IStartSyncOptions,
    data: IListAllCallbackData<Interfaces.SmartCollection>
  ) {
    const products = data.data;
    subProgress.syncedCount += products.length;
    const lastProduct = products[products.length - 1];
    subProgress.lastId = lastProduct.id;
    subProgress.info = lastProduct.title;
  }
}
