import { Options } from 'shopify-prime';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

export interface IShopifySyncSmartCollectionListOptions extends Options.CollectionListOptions, ISyncOptions {}
export interface IShopifySyncSmartCollectionGetOptions extends Options.CollectionGetOptions, ISyncOptions {}
export interface IShopifySyncSmartCollectionCountOptions extends Options.CollectionListOptions, ISyncOptions {}

export interface IAppSmartCollectionListOptions extends Options.CollectionListOptions, IAppListSortOptions, IAppListFilterOptions {}
export interface IAppSmartCollectionGetOptions extends Options.CollectionGetOptions {}
export interface IAppSmartCollectionCountOptions extends Options.CollectionCountOptions {}