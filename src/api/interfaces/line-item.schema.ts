import { Schema, Document } from 'mongoose';
import { LineItem, LineItemProperty } from 'shopify-prime/models';
import { TaxLineSchema } from './tax-line.schema';

export type LineItemPropertyDocument = LineItemProperty & Document;

export type LineItemDocument = LineItem & Document;

export const LineItemPropertySchema = new Schema({
  name: String,
  value: String, // ?
})

export const LineItemSchema = new Schema({
  fulfillable_quantity: Number,
  fulfillment_service: String,
  fulfillment_status: String,
  grams: Number,
  price: Number,
  product_id: Number,
  quantity: Number,
  requires_shipping: Boolean,
  sku: String,
  title: String,
  variant_id: Number,
  variant_title: String,
  name: String,
  vendor: String,
  gift_card: Boolean,
  taxable: Boolean,
  tax_lines: [TaxLineSchema],
  total_discount: Number,
  properties: [LineItemPropertySchema],
});
