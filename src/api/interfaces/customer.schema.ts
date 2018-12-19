import { Schema, Document } from 'mongoose';
import { Customer } from 'shopify-prime/models';
import { AddressSchema } from './address.schema';

export type CustomerDocument = Customer & Document;

export const CustomerSchema = new Schema({
  id: Number,
  accepts_marketing: Boolean,
  addresses: [AddressSchema],
  created_at: String,
  default_address: AddressSchema,
  email: String,
  first_name: String,
  multipass_identifier: String,
  last_name: String,
  last_order_id: Number,
  last_order_name: String,
  note: String,
  orders_count: Number,
  state: String,
  tags: String,
  tax_exempt: Boolean,
  total_spent: String,
  updated_at: String,
  verified_email: Boolean,
});