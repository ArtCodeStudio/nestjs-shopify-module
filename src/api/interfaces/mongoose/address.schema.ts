import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

export type AddressDocument = Interfaces.Address & Document;

export const AddressSchema = new Schema({
  id: Number,
  address1: String,
  address2: String,
  city: String,
  company: String,
  country: String,
  country_code: String,
  country_name: String,
  customer_id: Number,
  default: Boolean,
  first_name: String,
  last_name: String,
  latitude: Number,
  longitude: Number,
  name: String,
  phone: String,
  province: String,
  province_code: String,
  zip: String,
}, {
  minimize: false,
});