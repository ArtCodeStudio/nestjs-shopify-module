import { Schema, Document } from 'mongoose';
import { DiscountCode } from 'shopify-admin-api/dist/models';

export type DiscountCodeDocument = DiscountCode & Document;

export const DiscountCodeSchema = new Schema({
  amount: String,
  code: String,
  type: String,
}, {
  _id: false,
  minimize: false
});

