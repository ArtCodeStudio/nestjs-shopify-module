import { Schema, Document } from 'mongoose';
import { Refund, RefundLineItem, OrderAdjustment } from 'shopify-prime/models';
import { TransactionSchema } from './transaction.schema';
import { LineItemSchema } from './line-item.schema';

export type OrderAdjustmentDocument = OrderAdjustment & Document;

export type RefundLineItemDocument = RefundLineItem & Document;

export type RefundDocument = Refund & Document;

export const OrderAdjustmentSchema = new Schema({
  order_id: Number,
  refund_id: Number,
  amount: String,
  tax_amount: String,
  kind: String,
  reason: String,
});

export const RefundLineItemSchema = new Schema({
  id: Number,
  quantity: Number,
  line_item_id: Number,
  subtotal: Number,
  total_tax: Number,
  line_item: LineItemSchema,
})

export const RefundSchema = new Schema({
  id: Number,
  order_id: Number,
  created_at: String,
  note: String,
  restock: Boolean,
  user_id: Number,
  processed_at: String,
  refund_line_items: [RefundLineItemSchema],
  transactions: [TransactionSchema],
  order_adjustments: [OrderAdjustmentSchema],
});