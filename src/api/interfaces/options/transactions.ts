import { Options } from "shopify-admin-api";
import { IAppListSortOptions, IAppListFilterOptions } from "./basic";

/**
 * Transaction options to get a list of Transactions from the app
 */
export interface IAppTransactionListOptions
  extends Options.TransactionListOptions,
    IAppListSortOptions,
    IAppListFilterOptions {}
export type IAppTransactionGetOptions = Options.TransactionGetOptions;
export type IAppTransactionCountOptions = Options.TransactionCountOptions;
