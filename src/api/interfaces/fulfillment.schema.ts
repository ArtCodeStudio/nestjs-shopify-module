import { Schema, Document } from 'mongoose';
import { Fulfillment } from 'shopify-prime/models';
import { LineItemSchema } from './line-item.schema';

export type FulfillmentDocument = Fulfillment & Document;

export const FulfillmentSchema = new Schema({
  created_at: String,
  line_items: [LineItemSchema],
  order_id: Number,
  receipt: Object, // arbitrary object without defined interface
  status: String,
  tracking_company: String,
  tracking_number: String,
  tracking_numbers: [String],
  tracking_url: String,
  tracking_urls: [String],
  updated_at: String,
});
