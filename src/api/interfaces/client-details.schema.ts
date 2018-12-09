import { Schema, Document } from 'mongoose';
import { ClientDetails } from 'shopify-prime/models';

export type ClientDetailsDocument = ClientDetails & Document;

export const ClientDetailsSchema = new Schema({
  accept_language: String,
  browser_height: String,
  browser_ip: String,
  browser_width: String,
  session_height: String,
  user_agent: String,
});
