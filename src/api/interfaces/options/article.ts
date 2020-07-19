import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

export interface IShopifySyncArticleListOptions extends Options.ArticleListOptions, ISyncOptions {}
export interface IShopifySyncArticleGetOptions extends Options.ArticleGetOptions, ISyncOptions {}
export interface IShopifySyncArticleCountOptions extends Options.ArticleCountOptions {}

export interface IAppArticleListOptions extends Options.ArticleListOptions, IAppListSortOptions, IAppListFilterOptions {}
export interface IAppArticleGetOptions extends Options.ArticleGetOptions {}
export interface IAppArticleCountOptions extends Options.ArticleCountOptions {}