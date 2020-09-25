import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

export type DiscountApplicationDocument = Interfaces.DiscountApplication & Document;

export const DiscountApplicationSchema = new Schema({
  allocation_method: String,
  code: String,
  description: String,
  target_selection: String,
  target_type: String,
  title: String,
  type: String,
  value: String,
  value_type: String,
}, {
  _id: false,
  minimize: false,
});

