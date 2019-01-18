import { Options } from 'shopify-prime';

export interface IAppAssetListOptions extends Options.FieldOptions {
  key_starts_with?: string;
  content_type?: string;
}

