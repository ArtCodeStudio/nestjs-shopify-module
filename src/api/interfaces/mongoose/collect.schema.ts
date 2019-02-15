import { Schema, Document } from 'mongoose';
import { Collect } from 'shopify-prime/models';

export type CollectDocument = Collect & Document;

export const CollectSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  collection_id: Number,
  created_at: String,
  featured: Boolean,
  position: Number,
  product_id: Number,
  updated_at: String,
  sort_value: String,
});
