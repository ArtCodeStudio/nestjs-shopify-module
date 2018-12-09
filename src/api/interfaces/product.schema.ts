import { Schema, Document } from 'mongoose';
import { Product } from 'shopify-prime/models';

export type ProductDocument = Product & Document;

export const ProductOptionSchema = new Schema({
  product_id: Number,
  name: String,
  position: Number,
  values: [String],
});

export const ProductVariantSchema = new Schema({
  barcode: String,
  compare_at_price: String,
  created_at: String,
  fulfillment_service: String,
  grams: Number,
  weight: Number,
  weight_unit: String,
  inventory_management: String,
  inventory_policy: String,
  inventory_quantity: String,
  inventory_item_id: Number,
  option1: String,
  position: Number,
  price: Number,
  product_id: Number,
  requires_shipping: Boolean,
  sku: String,
  taxable: Boolean,
  title: String,
  updated_at: String,
});

export const ProductImageSchema = new Schema({
  product_id: Number,
  position: Number,
  created_at: String,
  updatd_at: String,
  src: String,
  filename: String,
  attachment: String,
  variant_ids: [Number],
});

export const ProductSchema = new Schema({
  title: String,
  body_html: String,
  created_at: String,
  updated_at: String,
  published_at: String,
  vendor: String,
  product_type: String,
  handle: String,
  template_suffix: String,
  published_scope: String,
  tags: String,
  variants: [ProductVariantSchema],
  options: [ProductOptionSchema],
  images: [ProductImageSchema],
  metafields_global_title_tag: String,
  metafields_global_description_tag: String,
});