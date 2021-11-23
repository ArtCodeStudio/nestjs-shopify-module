import { Schema, Document, DocumentDefinition } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

export type PriceSetDocument = DocumentDefinition<Interfaces.TaxLine> &
  Document;

export const MoneySchema = new Schema({
  amount: String,
  currency_code: String,
});

export const PriceSetSchema = new Schema(
  {
    shop_money: MoneySchema,
    presentment_money: MoneySchema,
  },
  {
    _id: false,
    minimize: false,
  },
);
