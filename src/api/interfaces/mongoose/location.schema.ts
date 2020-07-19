import { Schema, Document } from 'mongoose';
import { Location } from 'shopify-admin-api/dist/models';

export type LocationDocument = Location & Document;

export const LocationSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  country_code: String,
  province_code: String,
  name: String,
  address1: String,
  address2: String,
  city: String,
  zip: String,
}, {
  minimize: false,
});
