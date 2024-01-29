import { Options } from "shopify-admin-api";
import { ISyncOptions } from "./sync";

/**
 * Custom filter implementation (Not supported by Shopify)
 */
export interface IAppThemeListFilter {
  name?: string;
  created_at?: string;
  updated_at?: string;
  role?: "main" | "unpublished" | "demo";
  previewable?: boolean;
  processing?: boolean;
}

export interface IShopifySyncThemeListOptions
  extends Options.ThemeListOptions,
    ISyncOptions {}
export interface IShopifySyncThemeGetOptions
  extends Options.ThemeGetOptions,
    ISyncOptions {}

export type IAppThemeListOptions = Options.ThemeListOptions;
export type IAppThemeGetOptions = Options.ThemeGetOptions;
