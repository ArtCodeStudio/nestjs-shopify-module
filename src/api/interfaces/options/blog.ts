import { Options } from "shopify-admin-api";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

export interface IAppBlogListOptions
  extends Options.BlogListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppBlogGetOptions = Options.BlogGetOptions;
export type IAppBlogCountOptions = Options.BlogCountOptions;
