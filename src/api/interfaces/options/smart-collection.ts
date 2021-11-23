import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

export interface IShopifySyncSmartCollectionListOptions
  extends Options.CollectionListOptions,
    ISyncOptions {}
export interface IShopifySyncSmartCollectionGetOptions
  extends Options.CollectionGetOptions,
    ISyncOptions {}
export interface IShopifySyncSmartCollectionCountOptions
  extends Options.CollectionListOptions,
    ISyncOptions {}

export interface IAppSmartCollectionListOptions
  extends Options.CollectionListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppSmartCollectionGetOptions = Options.CollectionGetOptions;
export type IAppSmartCollectionCountOptions = Options.CollectionCountOptions;
