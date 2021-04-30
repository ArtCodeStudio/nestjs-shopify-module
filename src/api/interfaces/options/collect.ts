import { Options } from "shopify-admin-api";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

/**
 * Order options to get a list of collects from the app
 */
export interface IAppCollectListOptions
  extends Options.CollectListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppCollectGetOptions = Options.CollectGetOptions;
export type IAppCollectCountOptions = Options.CollectCountOptions;
