import { Schema, Document, DocumentDefinition } from "mongoose";
import { Interfaces } from "shopify-admin-api";

export type DiscountCodeDocument = DocumentDefinition<Interfaces.DiscountCode> &
  Document;

export const DiscountCodeSchema = new Schema(
  {
    amount: String,
    code: String,
    type: String,
  },
  {
    _id: false,
    minimize: false,
  }
);
