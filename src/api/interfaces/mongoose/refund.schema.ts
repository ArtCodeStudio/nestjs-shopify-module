import { Schema, Document, DocumentDefinition } from "mongoose";
import { Interfaces } from "shopify-admin-api";
import { TransactionSchema } from "./transaction.schema";
import { LineItemSchema } from "./line-item.schema";
import { PriceSetSchema } from "./price-set.schema";

export type OrderAdjustmentDocument =
  DocumentDefinition<Interfaces.OrderAdjustment> & Document;

export type RefundLineItemDocument =
  DocumentDefinition<Interfaces.RefundLineItem> & Document;

export type RefundDocument = DocumentDefinition<Interfaces.Refund> & Document;

export const OrderAdjustmentSchema = new Schema(
  {
    id: { type: Number, index: { unique: true, sparse: true } },
    amount: String,
    amount_set: PriceSetSchema,
    kind: String,
    order_id: Number,
    reason: String,
    refund_id: Number,
    tax_amount: String,
    tax_amount_set: PriceSetSchema,
  },
  {
    minimize: false,
  }
);

export const RefundLineItemSchema = new Schema(
  {
    id: { type: Number, index: { unique: true, sparse: true } },
    line_item_id: Number,
    line_item: LineItemSchema,
    location_id: Number,
    quantity: Number,
    restock_type: String,
    subtotal: Number,
    subtotal_set: PriceSetSchema,
    total_tax: Number, // Most money values are stored as strings, but this is actually stored as a number
    total_tax_set: PriceSetSchema,
  },
  {
    minimize: false,
  }
);

export const RefundSchema = new Schema(
  {
    admin_graphql_api_id: String,
    id: { type: Number, index: { unique: true, sparse: true } },
    created_at: String,
    note: String,
    order_adjustments: [OrderAdjustmentSchema],
    order_id: Number,
    processed_at: String,
    refund_line_items: [RefundLineItemSchema],
    restock: Boolean,
    user_id: Number,
    transactions: [TransactionSchema],
  },
  {
    minimize: false,
  }
);
