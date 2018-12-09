import { Schema, Document } from 'mongoose';
import { Order } from 'shopify-prime/models';

import { AddressSchema } from './address.schema';
import { ClientDetailsSchema } from './client-details.schema';
import { CustomerSchema } from './customer.schema';
import { DiscountCodeSchema } from './discount-code.schema';
import { FulfillmentSchema } from './fulfillment.schema';
import { RefundSchema } from './refund.schema';
import { LineItemSchema } from './line-item.schema';
import { NoteAttributeSchema } from './note-attribute.schema';
import { PaymentDetailsSchema } from './payment-details.schema';
import { ShippingLineSchema } from './shipping-line.schema';
import { TaxLineSchema } from './tax-line.schema';

export type OrderDocument = Order & Document;

export const OrderSchema = new Schema({
  id: Number,
  billing_address: AddressSchema,
  browser_ip: String,
  buyer_accepts_marketing: Boolean,
  cancel_reason: String,
  cancelled_at: String,
  cart_token: String,
  client_details: ClientDetailsSchema,
  closed_at: String,
  contact_email: String,
  created_at: String,
  currency: String,
  customer: CustomerSchema,
  discount_code: [DiscountCodeSchema],
  email: String,
  financial_status: String,
  fulfillments: [FulfillmentSchema],
  fulfillment_status: String,
  refunds: [RefundSchema],
  tags: [String],
  landing_site: [String],
  line_items: [LineItemSchema],
  name: String,
  note: String,
  note_attributes: NoteAttributeSchema,
  number: Number,
  order_number: Number,
  payment_details: PaymentDetailsSchema,
  processed_at: String,
  processing_method: String,
  referring_site: String,
  shipping_address: AddressSchema,
  shipping_lines: [ShippingLineSchema],
  source_name: String,
  subtotal_price: Number,
  tax_lines: [TaxLineSchema],
  taxes_included: Boolean,
  token: String,
  total_discounts: Number,
  total_line_items_price: Number,
  total_price: Number,
  total_price_usd: Number,
  total_tax: Number,
  total_weight: Number,
  updated_at: String,
});