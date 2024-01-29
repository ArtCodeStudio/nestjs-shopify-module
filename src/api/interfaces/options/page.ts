import { Options } from "shopify-admin-api";
import { ISyncOptions } from "./sync";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

export interface IShopifySyncPageListOptions
  extends Options.PageListOptions,
    ISyncOptions {}
export interface IShopifySyncPageGetOptions
  extends Options.PageGetOptions,
    ISyncOptions {}
export type IShopifySyncPageCountOptions = Options.PageCountOptions;

export interface IAppPageListOptions
  extends Options.PageListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppPageGetOptions = Options.PageGetOptions;
export type IAppPageCountOptions = Options.PageCountOptions;
