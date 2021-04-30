import { Options } from "shopify-admin-api";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

export interface IAppArticleListOptions
  extends Options.ArticleListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppArticleGetOptions = Options.ArticleGetOptions;
export type IAppArticleCountOptions = Options.ArticleCountOptions;
