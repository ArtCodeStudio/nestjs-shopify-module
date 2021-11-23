import { Schema, Document, DocumentDefinition } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';
import { PriceSetSchema } from './price-set.schema';

export type TaxLineDocument = DocumentDefinition<Interfaces.TaxLine> & Document;

export const TaxLineSchema = new Schema(
  {
    price: Number,
    rate: Number,
    title: String,
    price_set: PriceSetSchema,
  },
  {
    _id: false,
    minimize: false,
  },
);
/*
TaxLineSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret._id;
    delete ret.__parentArray;
    delete ret.__index;
  }
});*/
