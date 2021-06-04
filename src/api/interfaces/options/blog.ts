import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

export interface IShopifySyncBlogListOptions
  extends Options.BlogListOptions,
    ISyncOptions {}
export interface IShopifySyncBlogGetOptions
  extends Options.BlogGetOptions,
    ISyncOptions {}
export type IShopifySyncBlogCountOptions = Options.BlogCountOptions;

export interface IAppBlogListOptions
  extends Options.BlogListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppBlogGetOptions = Options.BlogGetOptions;
export type IAppBlogCountOptions = Options.BlogCountOptions;
