import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

export interface IShopifySyncBlogListOptions extends Options.BlogListOptions, ISyncOptions {}
export interface IShopifySyncBlogGetOptions extends Options.BlogGetOptions, ISyncOptions {}
export interface IShopifySyncBlogCountOptions extends Options.BlogCountOptions {}

export interface IAppBlogListOptions extends Options.BlogListOptions, IAppListSortOptions, IAppListFilterOptions {}
export interface IAppBlogGetOptions extends Options.BlogGetOptions {}
export interface IAppBlogCountOptions extends Options.BlogCountOptions {}