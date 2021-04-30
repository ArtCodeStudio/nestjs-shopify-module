import { Options } from "shopify-admin-api";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

export interface IAppCollectionListOptions
  extends Options.CollectionListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppCollectionGetOptions = Options.CollectionGetOptions;
export type IAppCollectionCountOptions = Options.CollectionCountOptions;
