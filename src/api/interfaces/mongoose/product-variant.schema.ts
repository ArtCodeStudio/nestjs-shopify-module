import { Schema, Document, DocumentDefinition } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

export type ProductVariantDocument = DocumentDefinition<Interfaces.ProductVariant> & Document;

export const ProductVariantOptionSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  product_id: Number,
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