import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';
import { LineItemSchema } from './line-item.schema';

export type FulfillmentDocument = Interfaces.Fulfillment & Document;

export const FulfillmentSchema = new Schema({
  id: {type: Number, index: {unique: true, sparse: true}},
  created_at: String,
  admin_graphql_api_id: String,
  line_items: [LineItemSchema],
  location_id: Number,
  name: String,
  notify_customer: Boolean,
  order_id: Number,
  receipt: Object, // arbitrary object without defined interface
  service: String,
  shipment_status: String,
  status: String,
  tracking_company: String,
  tracking_number: String,
  tracking_numbers: [], // TODO [String], https://github.com/Automattic/mongoose/issues/9617
  tracking_url: String,
  tracking_urls: [], // TODO [String], https://github.com/Automattic/mongoose/issues/9617
  updated_at: String,
  variant_inventory_management: String,
}, {
  minimize: false,
});
