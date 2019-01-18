import { Options } from 'shopify-prime';
import { ISyncOptions } from './sync'

/**
 * Custom filter implementation (Not supported by Shopify)
 */
export interface IAppThemeListFilter {
  name?: string;
  created_at?: string;
  updated_at?: string;
  role?: 'main' | 'unpublished' | 'demo';
  previewable?: boolean;
  processing?: boolean;
}

export interface IShopifySyncThemeListOptions extends Options.ThemeListOptions, ISyncOptions {}
export interface IShopifySyncThemeGetOptions extends Options.ThemeGetOptions, ISyncOptions {}

export interface IAppThemeListOptions extends Options.ThemeListOptions {}
export interface IAppThemeGetOptions extends Options.ThemeGetOptions {}