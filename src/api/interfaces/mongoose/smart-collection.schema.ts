import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';
import { CollectionImageSchema } from './collection-image.schema';

export type SmartCollectionDocument = Interfaces.SmartCollection & Document;

export const SmartCollectionRuleSchema = new Schema({
  column: String,
  relation: String,
  condition: String,
});

export const SmartCollectionSchema = new Schema({
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
  disjunctive: Boolean,
  rules: [SmartCollectionRuleSchema],
});
