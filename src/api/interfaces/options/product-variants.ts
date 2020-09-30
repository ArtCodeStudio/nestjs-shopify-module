import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

/**
 * Product variant options to get a list of products from shopify
 */
export interface IShopifySyncProductVariantListOptions extends Options.ProductVariantListOptions, ISyncOptions {}
export interface IShopifySyncProductVariantGetOptions extends Options.ProductVariantGetOptions, ISyncOptions {}
export interface IShopifySyncProductVariantCountOptions extends Options.ProductVariantCountOptions {}

/**
 * Product variant options to get a list of products from the app
 */
export interface IAppProductVariantListOptions extends Options.ProductVariantListOptions, IAppListSortOptions, IAppListFilterOptions {}
export interface IAppProductVariantGetOptions extends Options.ProductVariantGetOptions {}
export interface IAppProductVariantCountOptions extends Options.ProductVariantCountOptions {}