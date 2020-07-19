import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

/**
 * Order options to get a list of collects from shopify
 */
export interface IShopifySyncCollectListOptions extends Options.CollectListOptions, ISyncOptions {}
export interface IShopifySyncCollectGetOptions extends Options.CollectGetOptions, ISyncOptions {}
export interface IShopifySyncCollectCountOptions extends Options.CollectCountOptions {}

/**
 * Order options to get a list of collects from the app
 */
export interface IAppCollectListOptions extends Options.CollectListOptions, IAppListSortOptions, IAppListFilterOptions {}
export interface IAppCollectGetOptions extends Options.CollectGetOptions {}
export interface IAppCollectCountOptions extends Options.CollectCountOptions {}
