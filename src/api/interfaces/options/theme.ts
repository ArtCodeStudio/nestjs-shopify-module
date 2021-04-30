import { Options } from "shopify-admin-api";
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

export type IAppThemeListOptions = Options.ThemeListOptions;
export type IAppThemeGetOptions = Options.ThemeGetOptions;
