import { Schema, Document } from 'mongoose';
import { Transaction } from 'shopify-prime/models';
import { PaymentDetailsSchema } from './payment-details.schema';

export type TransactionDocument = Transaction & Document;

export const TransactionSchema = new Schema({
  amount: String,
  authorization: String,
  created_at: String,
  device_id: String,
  gateway: String,
  source_name: String,
  payment_details: PaymentDetailsSchema,
  kind: String,
  order_id: Number,
  receipt: String, // arbitrary object: saved as json string
  error_code: String,
  status: String,
  test: Boolean,
  user_id: Number,
  currency: String,
});