import { Schema, Document } from 'mongoose';
import { DiscountAllocation } from 'shopify-prime/models';
import { PriceSetSchema } from './price-set.schema';

export type DiscountAllocationDocument = DiscountAllocation & Document;

export const DiscountAllocationSchema = new Schema({
  amount: Number,
  amount_set: PriceSetSchema,
  discount_application_index: Number,
}, {
  _id: false
});

