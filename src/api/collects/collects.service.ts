import { Inject, Injectable } from "@nestjs/common";
import { EventService } from "../../event.service";
import { ShopifyApiRootCountableService } from "../shopify-api-root-countable.service";

// Interfaces
import { Model } from "mongoose";
import { Collects, Interfaces, Options } from "shopify-admin-api";
import { CollectDocument } from "../interfaces";
import {
  SyncProgressDocument,
  Resource,
  ShopifyModuleOptions,
} from "../../interfaces";
import { SHOPIFY_MODULE_OPTIONS } from "../../shopify.constants";

@Injectable()
export class CollectsService extends ShopifyApiRootCountableService<
  Interfaces.Collect, // ShopifyObjectType
  Collects, // ShopifyModelClass
  Options.CollectCountOptions, // CountOptions
  Options.CollectGetOptions, // GetOptions
  Options.CollectListOptions, // ListOptions
  CollectDocument // DatabaseDocumentType
> {
  resourceName: Resource = "collects";
  subResourceNames: Resource[] = [];

  constructor(
    @Inject("CollectModelToken")
    private readonly collectModel: (shopName: string) => Model<CollectDocument>,
    @Inject("SyncProgressModelToken")
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    protected readonly eventService: EventService,
    @Inject(SHOPIFY_MODULE_OPTIONS)
    protected readonly shopifyModuleOptions: ShopifyModuleOptions
  ) {
    super(
      collectModel,
      Collects,
      eventService,
      syncProgressModel,
      shopifyModuleOptions
    );
  }
}
