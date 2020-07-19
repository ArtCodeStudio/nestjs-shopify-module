import { Schema, Document } from 'mongoose';
import { Blog, MetaField } from 'shopify-admin-api/dist/models';
import { MetafieldSchema } from './metafield.schema';

export type BlogDocument = Blog & Document;

export const BlogSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  commentable: Boolean,
  created_at: String,
  feedburner: String,
  feedburner_location: String,
  handle: String,
  metafield: MetafieldSchema,
  tags: String,
  template_suffix: String,
  title: String,
  updated_at: String,
});
