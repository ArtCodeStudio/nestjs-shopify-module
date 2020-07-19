import { Options } from 'shopify-admin-api';

export interface IAppAssetListOptions extends Options.FieldOptions {
  key_starts_with?: string;
  content_type?: string;
}
