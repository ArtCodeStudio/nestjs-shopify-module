import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';
import { AddressSchema } from './address.schema';

export type CustomerDocument = Interfaces.Customer & Document;

export const CustomerSchema = new Schema({
  id: Number,
  admin_graphql_api_id: String,
  accepts_marketing: Boolean,
  addresses: [AddressSchema],
  created_at: String,
  currency: String,
  default_address: AddressSchema,
  email: String,
  first_name: String,
  last_name: String,
  last_order_id: Number,
  last_order_name: String,
  multipass_identifier: String,
  note: String,
  orders_count: Number,
  phone: String,
  state: String,
  tags: String,
  tax_exempt: Boolean,
  total_spent: String,
  updated_at: String,
  verified_email: Boolean,
}, {
  minimize: false,
});