/**
 * Interfaces for the custom locales api (Not supported by Shopify)
 */

import { IAppAsset } from './assets';

export interface IAppLocales {
  [langcode: string]: any;
}

export interface IAppLocaleFile extends IAppAsset {
  json?: any;
  lang_code?: string;
  is_default?: boolean;
  locales?: IAppLocales;
}