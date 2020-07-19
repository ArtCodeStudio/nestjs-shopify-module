import { Schema, Document } from 'mongoose';
import { ClientDetails } from 'shopify-admin-api/dist/models';

export type ClientDetailsDocument = ClientDetails & Document;

export const ClientDetailsSchema = new Schema({
  accept_language: String,
  browser_height: Number,
  browser_ip: String,
  browser_width: Number,
  session_hash: String,
  user_agent: String,
}, {
  _id: false,
  minimize: false,
});
