import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';
import { ProductVariantSchema } from './product-variant.schema'

export type ProductDocument = Interfaces.Product & Document;

export const ProductOptionSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  product_id: Number,
  name: String,
  position: Number,
  values: [], // TODO [String],
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
  variant_ids: [], // TODO [Number]
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