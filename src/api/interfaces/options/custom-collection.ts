import { Options } from 'shopify-prime';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

export interface IShopifySyncCustomCollectionListOptions extends Options.CollectionListOptions, ISyncOptions {}
export interface IShopifySyncCustomCollectionGetOptions extends Options.CollectionGetOptions, ISyncOptions {}
export interface IShopifySyncCustomCollectionCountOptions extends Options.CollectionListOptions, ISyncOptions {}

export interface IAppCustomCollectionListOptions extends Options.CollectionListOptions, IAppListSortOptions, IAppListFilterOptions {}
export interface IAppCustomCollectionGetOptions extends Options.CollectionGetOptions {}
export interface IAppCustomCollectionCountOptions extends Options.CollectionListOptions {}