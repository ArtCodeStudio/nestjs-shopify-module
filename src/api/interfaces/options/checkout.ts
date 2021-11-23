/* eslint-disable @typescript-eslint/no-empty-interface */
import { Options } from 'shopify-admin-api';
import { ISyncOptions } from './sync';
import { IAppListSortOptions, IAppListFilterOptions } from './basic';

/**
 * Product variant options to get a list of products from shopify
 */
export interface IShopifySyncCheckoutListOptions
  extends Options.CheckoutListOptions,
    ISyncOptions {}
export interface IShopifySyncCheckoutGetOptions
  extends Options.CheckoutGetOptions,
    ISyncOptions {}
export interface IShopifySyncCheckoutCountOptions {}

/**
 * Product variant options to get a list of products from the app
 */
export interface IAppCheckoutListOptions
  extends IAppListSortOptions,
    IAppListFilterOptions {}
export interface IAppCheckoutGetOptions {}
export interface IAppCheckoutCountOptions {}
