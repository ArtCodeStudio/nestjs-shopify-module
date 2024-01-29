import { Options } from "shopify-admin-api";
import { ISyncOptions } from "./sync";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

export interface IShopifySyncCustomCollectionListOptions
  extends Options.CollectionListOptions,
    ISyncOptions {}
export interface IShopifySyncCustomCollectionGetOptions
  extends Options.CollectionGetOptions,
    ISyncOptions {}
export interface IShopifySyncCustomCollectionCountOptions
  extends Options.CollectionListOptions,
    ISyncOptions {}

export interface IAppCustomCollectionListOptions
  extends Options.CollectionListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppCustomCollectionGetOptions = Options.CollectionGetOptions;
export type IAppCustomCollectionCountOptions = Options.CollectionListOptions;
