import { Schema, Document, DocumentDefinition } from "mongoose";
import { Interfaces } from "shopify-admin-api";
import { PriceSetSchema } from "./price-set.schema";

export type DiscountAllocationDocument =
  DocumentDefinition<Interfaces.DiscountAllocation> & Document;

export const DiscountAllocationSchema = new Schema(
  {
    amount: Number,
    amount_set: PriceSetSchema,
    discount_application_index: Number,
  },
  {
    _id: false,
    minimize: false,
  }
);
