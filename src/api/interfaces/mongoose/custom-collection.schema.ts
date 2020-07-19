import { Schema, Document } from 'mongoose';
import { CustomCollection } from 'shopify-admin-api/dist/models';
import { CollectionImageSchema } from './collection-image.schema';

export type CustomCollectionDocument = CustomCollection & Document;

export const CustomCollectionSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  admin_graphql_api_id: String,
  body_html: String,
  handle: String,
  image: CollectionImageSchema,
  published_at: String,
  published_scope: String,
  sort_order: String,
  template_suffix: String,
  title: String,
  updated_at: String,
  metafield: String,
});
