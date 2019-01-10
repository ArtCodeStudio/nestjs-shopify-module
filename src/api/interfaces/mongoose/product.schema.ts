import { Schema, Document } from 'mongoose';
import { Product } from 'shopify-prime/models';

export type ProductDocument = Product & Document;

export const ProductOptionSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  product_id: Number,
  name: String,
  position: Number,
  values: [String],
});

export const ProductVariantSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  admin_graphql_api_id: String,
  barcode: String,
  compare_at_price: String,
  created_at: String,
  fulfillment_service: String,
  grams: Number,
  image_id: Number,
  inventory_item_id: Number,
  inventory_management: String,
  inventory_policy: String,
  inventory_quantity: Number,
  old_inventory_quantity: Number,
  option1: String,
  option2: String,
  option3: String,
  position: Number,
  price: String,
  product_id: Number,
  requires_shipping: Boolean,
  sku: String,
  tax_code: String,
  taxable: Boolean,
  title: String,
  updated_at: String,
  weight: Number,
  weight_unit: String,
});

export const ProductImageSchema = new Schema({
  id: {type: Number, index: {unique: true, sparse: true}},
  admin_graphql_api_id: String,
  alt: String,
  created_at: String,
  height: Number,
  position: Number,
  product_id: Number,
  src: String,
  updated_at: String,
  variant_ids: [Number],
  width: Number,
});

export const ProductSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  admin_graphql_api_id: String,
  body_html: String,
  created_at: String,
  handle: String,
  image: ProductImageSchema,
  images: [ProductImageSchema],
  metafields_global_title_tag: String,
  metafields_global_description_tag: String,
  options: [ProductOptionSchema],
  product_type: String,
  published_at: String,
  published_scope: String,
  tags: String,
  template_suffix: String,
  title: String,
  updated_at: String,
  variants: [ProductVariantSchema],
  vendor: String,
});
/*
ProductSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret._id;
    delete ret.__v;
  }
});*/