import { Options } from 'shopify-prime';
import { SyncOptions } from './sync-options'

/**
 * Product options to get a list of products from shopify
 */
export interface ShopifySyncProductListOptions extends Options.ProductListOptions, SyncOptions {}
export interface ShopifySyncProductGetOptions extends Options.FieldOptions, SyncOptions {}
export interface ShopifySyncProductCountOptions extends Options.ProductCountOptions {}

/**
 * Product options to get a list of products from the app
 */
export interface AppProductListOptions extends Options.ProductListOptions {}
export interface AppProductGetOptions extends Options.FieldOptions {}
export interface AppProductCountOptions extends Options.ProductCountOptions {}