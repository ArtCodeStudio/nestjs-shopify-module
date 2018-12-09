import { Schema, Document } from 'mongoose';
import { Theme } from 'shopify-prime/models';

export type ThemeDocument = Theme & Document;

export const ThemeSchema = new Schema({
  name: String,
  created_at: String,
  updated_at: String,
  role: String,
  theme_store_id: Number,
  previewable: Boolean,
  processing: Boolean,
});
