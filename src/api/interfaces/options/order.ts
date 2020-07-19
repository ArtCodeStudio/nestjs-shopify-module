import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

/**
 * Order options to get a list of orders from shopify
 */
export interface IShopifySyncOrderListOptions extends Options.OrderListOptions, ISyncOptions {}
export interface IShopifySyncOrderGetOptions extends Options.OrderGetOptions, ISyncOptions {}
export interface IShopifySyncOrderCountOptions extends Options.OrderCountOptions {}

/**
 * Order options to get a list of orders from the app
 */
export interface IAppOrderListOptions extends Options.OrderListOptions, IAppListSortOptions, IAppListFilterOptions {}
export interface IAppOrderGetOptions extends Options.OrderGetOptions {}
export interface IAppOrderCountOptions extends Options.OrderCountOptions {}
