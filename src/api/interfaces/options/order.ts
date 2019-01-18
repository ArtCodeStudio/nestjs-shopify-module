import { Options } from 'shopify-prime';
import { ISyncOptions } from './sync'

/**
 * Order options to get a list of orders from shopify
 */
export interface IShopifySyncOrderListOptions extends Options.OrderListOptions, ISyncOptions {}
export interface IShopifySyncOrderGetOptions extends Options.OrderGetOptions, ISyncOptions {}
export interface IShopifySyncOrderCountOptions extends Options.OrderCountOptions {}

/**
 * Order options to get a list of orders from the app
 */
export interface IAppOrderListOptions extends Options.OrderListOptions {}
export interface IAppOrderGetOptions extends Options.OrderGetOptions {}
export interface IAppOrderCountOptions extends Options.OrderCountOptions {}
