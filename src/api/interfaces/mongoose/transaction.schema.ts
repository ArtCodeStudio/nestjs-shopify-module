import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';
import { PaymentDetailsSchema } from './payment-details.schema';

export type TransactionDocument = Interfaces.Transaction & Document;

export const TransactionSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  admin_graphql_api_id: String,
  amount: String,
  authorization: String,
  created_at: String,
  currency: String,
  device_id: Number,
  error_code: String,
  gateway: String,
  kind: String,
  location_id: Number,
  message: String,
  order_id: Number,
  parent_id: Number,
  payment_details: PaymentDetailsSchema,
  processed_at: String,
  receipt: Object, // arbitrary object without defined interface
  source_name: String,
  status: String,
  test: Boolean,
  user_id: Number,
}, {
  minimize: false,
});

/*
TransactionSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret._id;
    delete ret.__v;
  }
});*/