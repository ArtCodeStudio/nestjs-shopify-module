import { Options } from 'shopify-prime';
import { ISyncOptions } from './sync';
import { IAppListSortOptions } from './basic';

/**
 * Product options to get a list of products from shopify
 */
export interface IShopifySyncProductListOptions extends Options.ProductListOptions, ISyncOptions {}
export interface IShopifySyncProductGetOptions extends Options.ProductGetOptions, ISyncOptions {}
export interface IShopifySyncProductCountOptions extends Options.ProductCountOptions {}

/**
 * Product options to get a list of products from the app
 */
export interface IAppProductListOptions extends Options.ProductListOptions, IAppListSortOptions {}
export interface IAppProductGetOptions extends Options.ProductGetOptions {}
export interface IAppProductCountOptions extends Options.ProductCountOptions {}