import { Schema, Document } from 'mongoose';
import { Asset } from 'shopify-prime/models';

export type AssetDocument = Asset & Document;

export const AssetSchema = new Schema({
  attachment: String,
  content_type: String,
  created_at: String,
  key: String,
  public_url: String,
  size: Number,
  theme_id: Number,
  updated_at: String,
  value: String,
}, {
  minimize: false,
});
