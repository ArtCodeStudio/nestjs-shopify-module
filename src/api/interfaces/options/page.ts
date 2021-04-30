import { Options } from "shopify-admin-api";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

export interface IAppPageListOptions
  extends Options.PageListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppPageGetOptions = Options.PageGetOptions;
export type IAppPageCountOptions = Options.PageCountOptions;
