import { Schema, Document } from 'mongoose';
import { LineItem, LineItemProperty } from 'shopify-prime/models';
import { TaxLineSchema } from './tax-line.schema';
import { PriceSetSchema } from './price-set.schema';
import { LocationSchema } from './location.schema';
import { DiscountAllocationSchema } from './discount-allocation.schema';

export type LineItemPropertyDocument = LineItemProperty & Document;

export type LineItemDocument = LineItem & Document;

export const LineItemPropertySchema = new Schema({
  name: String,
  value: String, // ?
})

export const LineItemSchema = new Schema({
  id: {type: Number, index: {unique: true, sparse: true}},
  admin_graphql_api_id: String,
  discount_allocations: [DiscountAllocationSchema],
  destination_location: LocationSchema,
  fulfillable_quantity: Number,
  fulfillment_service: String,
  fulfillment_status: String,
  grams: Number,
  name: String,
  origin_location: LocationSchema,
  pre_tax_price: String,
  pre_tax_price_set: PriceSetSchema,
  price: String,
  price_set: PriceSetSchema,
  product_id: Number,
  product_exists: Boolean,
  quantity: Number,
  requires_shipping: Boolean,
  sku: String,
  title: String,
  variant_id: Number,
  variant_inventory_management: String,
  variant_title: String,
  vendor: String,
  gift_card: Boolean,
  taxable: Boolean,
  tax_lines: [TaxLineSchema],
  total_discount: String,
  total_discount_set: PriceSetSchema,
  properties: [LineItemPropertySchema],
}, {
  minimize: false,
});
