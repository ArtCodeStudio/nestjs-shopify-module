import { Options } from "shopify-admin-api";
import { ISyncOptions } from "./sync";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

/**
 * Product options to get a list of products from shopify
 */
export interface IShopifySyncProductListOptions
  extends Options.ProductListOptions,
    ISyncOptions {}
export interface IShopifySyncProductGetOptions
  extends Options.ProductGetOptions,
    ISyncOptions {}
export type IShopifySyncProductCountOptions = Options.ProductCountOptions;

/**
 * Product options to get a list of products from the app
 */
export interface IAppProductListOptions
  extends Options.ProductListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {
  price_max?: number;
  price_min?: number;
}
export type IAppProductGetOptions = Options.ProductGetOptions;
export type IAppProductCountOptions = Options.ProductCountOptions;
