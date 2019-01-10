import { Schema, Document } from 'mongoose';
import { MetaField } from 'shopify-prime/models';

export type MetafieldDocument = MetaField & Document;

export const MetafieldSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  updated_at: String,
  key: String,
  value: String,
  value_type: String,
  namespace: String,
  description: String,
  owner_id: Number,
  owner_resource: String,
});
