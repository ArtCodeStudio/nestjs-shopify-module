import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

export type DiscountCodeDocument = Interfaces.DiscountCode & Document;

export const DiscountCodeSchema = new Schema({
  amount: String,
  code: String,
  type: String,
}, {
  _id: false,
  minimize: false
});

