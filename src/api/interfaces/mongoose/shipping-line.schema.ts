import { Schema, Document } from 'mongoose';
import { ShippingLine } from 'shopify-admin-api/dist/models';
import { TaxLineSchema } from './tax-line.schema';
import { PriceSetSchema } from './price-set.schema';
import { DiscountAllocationSchema } from './discount-allocation.schema';

export type ShippingLineDocument = ShippingLine & Document;

export const ShippingLineSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  carrier_identifier: String,
  code: String,
  delivery_category: Object, // undocumented, always null in all known test data
  discount_allocations: [DiscountAllocationSchema],
  discounted_price: String,
  discounted_price_set: PriceSetSchema,
  phone: String,
  price: String,
  price_set: PriceSetSchema,
  requested_fulfillment_service_id: Number,
  source: String,
  title: String,
  tax_lines: [TaxLineSchema],
}, {
  minimize: false,
});