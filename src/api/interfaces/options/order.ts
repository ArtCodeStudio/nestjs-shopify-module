import { Options } from "shopify-admin-api";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

/**
 * Order options to get a list of orders from the app
 */
export interface IAppOrderListOptions
  extends Options.OrderListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppOrderGetOptions = Options.OrderGetOptions;
export type IAppOrderCountOptions = Options.OrderCountOptions;
