import { Schema, Document } from 'mongoose';
import { TaxLine } from 'shopify-prime/models';

export type TaxLineDocument = TaxLine & Document;

export const TaxLineSchema = new Schema({
  price: Number,
  rate: Number,
  title: String,
});