/**
 * Interfaces for the custom locales api (Not supported by Shopify)
 */

import { IAppAssetListOptions } from './asset';

export interface IAppLocaleListOptions extends IAppAssetListOptions {
  lang_code?: string;
}
