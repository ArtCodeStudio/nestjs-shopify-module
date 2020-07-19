import { Schema, Document } from 'mongoose';
import { Page, MetaField } from 'shopify-admin-api/dist/models';
import { MetafieldSchema } from './metafield.schema';

export type PageDocument = Page & Document;

export const PageSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  author: String,
  body_html: String,
  created_at: String,
  handle: String,
  metafield: MetafieldSchema,
  published_at: String,
  shop_id: String,
  template_suffix: String,
  title: String,
  updated_at: String,
});
