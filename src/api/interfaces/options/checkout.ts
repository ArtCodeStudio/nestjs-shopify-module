/* eslint-disable @typescript-eslint/no-empty-interface */
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

/**
 * Product variant options to get a list of products from the app
 */
export interface IAppCheckoutListOptions
  extends IAppListSortOptions,
    IAppListFilterOptions {}
export interface IAppCheckoutGetOptions {}
export interface IAppCheckoutCountOptions {}
