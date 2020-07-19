import { Schema, Document } from 'mongoose';
import { Order } from 'shopify-admin-api/dist/models';

import { AddressSchema } from './address.schema';
import { ClientDetailsSchema } from './client-details.schema';
import { CustomerSchema } from './customer.schema';
import { DiscountCodeSchema } from './discount-code.schema';
import { DiscountApplicationSchema } from './discount-application.schema';
import { FulfillmentSchema } from './fulfillment.schema';
import { RefundSchema } from './refund.schema';
import { LineItemSchema } from './line-item.schema';
import { NoteAttributeSchema } from './note-attribute.schema';
import { PaymentDetailsSchema } from './payment-details.schema';
import { PriceSetSchema } from './price-set.schema';
import { ShippingLineSchema } from './shipping-line.schema';
import { TaxLineSchema } from './tax-line.schema';

export type OrderDocument = Order & Document;

export const OrderSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  admin_graphql_api_id: String,
  app_id: Number,
  billing_address: AddressSchema,
  browser_ip: String,
  buyer_accepts_marketing: Boolean,
  cancel_reason: String,
  cancelled_at: String,
  cart_token: String,
  checkout_id: Number,
  checkout_token: String,
  client_details: ClientDetailsSchema,
  closed_at: String,
  contact_email: String,
  confirmed: Boolean,
  created_at: String,
  currency: String,
  customer: CustomerSchema,
  customer_locale: String,
  device_id: Number,
  discount_applications: [DiscountApplicationSchema],
  discount_codes: [DiscountCodeSchema],
  email: String,
  financial_status: String,
  fulfillments: [FulfillmentSchema],
  fulfillment_status: String,
  gateway: String,
  refunds: [RefundSchema],
  tags: String,
  landing_site: String,
  landing_site_ref: String,
  line_items: [LineItemSchema],
  location_id: Number,
  name: String,
  note: String,
  note_attributes: [NoteAttributeSchema],
  number: Number,
  order_number: Number,
  order_status_url: String,
  phone: String,
  payment_details: PaymentDetailsSchema,
  payment_gateway_names: [String],
  presentment_currency: String,
  processed_at: String,
  processing_method: String,
  reference: String,
  referring_site: String,
  shipping_address: AddressSchema,
  shipping_lines: [ShippingLineSchema],
  source_identifier: String,
  source_name: String,
  source_url: String,
  subtotal_price: Number,
  subtotal_price_set: PriceSetSchema,
  tax_lines: [TaxLineSchema],
  taxes_included: Boolean,
  test: Boolean,
  token: String,
  total_discounts: Number,
  total_discounts_set: PriceSetSchema,
  total_line_items_price: Number,
  total_line_items_price_set: PriceSetSchema,
  total_shipping_price_set: PriceSetSchema,
  total_price: Number,
  total_price_usd: Number,
  total_price_set: PriceSetSchema,
  total_tax: Number,
  total_tax_set: PriceSetSchema,
  total_tip_received: String,
  total_weight: Number,
  updated_at: String,
  user_id: Number,
}, {
  minimize: false,
});
/*
OrderSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret._id;
    delete ret.__v;
  }
});*/