import { Schema, Document } from 'mongoose';
import { TaxLine } from 'shopify-prime/models';

export type PriceSetDocument = TaxLine & Document;

export const PriceSetSchema = new Schema({
  shop_money: {
    amount: String,
    currency_code: String,
  },
  presentment_money: {
    amount: String,
    currency_code: String,
  }
}, {
  _id: false,
  minimize: false,
});