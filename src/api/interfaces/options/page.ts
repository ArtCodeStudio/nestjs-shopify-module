import { Options } from 'shopify-prime';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

export interface IShopifySyncPageListOptions extends Options.PageListOptions, ISyncOptions {}
export interface IShopifySyncPageGetOptions extends Options.PageGetOptions, ISyncOptions {}
export interface IShopifySyncPageCountOptions extends Options.PageCountOptions {}

export interface IAppPageListOptions extends Options.PageListOptions, IAppListSortOptions, IAppListFilterOptions {}
export interface IAppPageGetOptions extends Options.PageGetOptions {}
export interface IAppPageCountOptions extends Options.PageCountOptions {}