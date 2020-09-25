import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

export type CollectDocument = Interfaces.Collect & Document;

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
