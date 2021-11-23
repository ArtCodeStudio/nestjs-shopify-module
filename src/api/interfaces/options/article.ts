import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

export interface IShopifySyncArticleListOptions
  extends Options.ArticleListOptions,
    ISyncOptions {}
export interface IShopifySyncArticleGetOptions
  extends Options.ArticleGetOptions,
    ISyncOptions {}
export type IShopifySyncArticleCountOptions = Options.ArticleCountOptions;

export interface IAppArticleListOptions
  extends Options.ArticleListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppArticleGetOptions = Options.ArticleGetOptions;
export type IAppArticleCountOptions = Options.ArticleCountOptions;
