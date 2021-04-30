import { Options } from "shopify-admin-api";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

/**
 * Product variant options to get a list of products from the app
 */
export interface IAppProductVariantListOptions
  extends Options.ProductVariantListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppProductVariantGetOptions = Options.ProductVariantGetOptions;
export type IAppProductVariantCountOptions = Options.ProductVariantCountOptions;
