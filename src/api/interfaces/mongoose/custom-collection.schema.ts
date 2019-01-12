import { Schema, Document } from 'mongoose';
import { CustomCollection } from 'shopify-prime/models';
import { CollectionImageSchema } from './collection-image.schema';

export type CustomCollectionDocument = CustomCollection & Document;

export const CustomCollectionCollectSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  product_id: Number,
  position: Number,
});

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
  // only for smart collection
  collects: [CustomCollectionCollectSchema],
  metafield: String,
});
