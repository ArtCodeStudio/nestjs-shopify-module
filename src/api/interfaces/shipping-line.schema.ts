import { Schema, Document } from 'mongoose';
import { ShippingLine } from 'shopify-prime/models';
import { TaxLineSchema } from './tax-line.schema';

export type ShippingLineDocument = ShippingLine & Document;

export const ShippingLineSchema = new Schema({
  code: String,
  price: Number,
  source: String,
  title: String,
  tax_lines: [TaxLineSchema],
});