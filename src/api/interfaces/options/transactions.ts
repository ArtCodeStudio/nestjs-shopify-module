import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

/**
 * Transaction options to get a list of transactions from shopify
 */
export interface IShopifySyncTransactionListOptions extends Options.TransactionListOptions, ISyncOptions {}
export interface IShopifySyncTransactionGetOptions extends Options.TransactionGetOptions, ISyncOptions {}
export type IShopifySyncTransactionCountOptions = Options.TransactionCountOptions

/**
 * Transaction options to get a list of Transactions from the app
 */
export interface IAppTransactionListOptions extends Options.TransactionListOptions, IAppListSortOptions, IAppListFilterOptions {}
export type IAppTransactionGetOptions = Options.TransactionGetOptions
export type IAppTransactionCountOptions = Options.TransactionCountOptions
