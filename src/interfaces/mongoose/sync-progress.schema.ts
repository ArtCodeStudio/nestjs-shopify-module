import * as mongoose from 'mongoose';
import { Schema, Document } from 'mongoose';
import { ISyncProgress } from '../sync-progress';
import { IProductSyncProgress } from '../sync-progress-product';
import { IOrderSyncProgress } from '../sync-progress-order';

export const SyncOptionsSchema = new mongoose.Schema({
  includeOrders: Boolean,
  includeTransactions: Boolean,
  includeProducts: Boolean,
  resync: Boolean,
  cancelExisting: Boolean,
});

export const OrderSyncProgressSchema = new mongoose.Schema({
  shop: String,
  shopifyCount: Number,
  syncedCount: Number,
  syncedTransactionsCount: Number,
  sinceId: Number,
  lastId: Number,

  includeTransactions: Boolean,

  createdAt: Date,
  updatedAt: Date,
  state: String,
  error: String,

  continuedFromPrevious: { type: Schema.Types.ObjectId, ref: 'shopify_sync-progress' }
}, {
  timestamps: true,
});

export type OrderSyncProgressDocument = IOrderSyncProgress & Document;

export const ProductSyncProgressSchema = new mongoose.Schema({
  shop: String,
  shopifyCount: Number,
  syncedCount: Number,
  sinceId: Number,
  lastId: Number,

  createdAt: Date,
  updatedAt: Date,
  state: String,
  error: String,

  continuedFromPrevious: { type: Schema.Types.ObjectId, ref: 'shopify_sync-progress' }
}, {
  timestamps: true,
});

export type ProductSyncProgressDocument = IProductSyncProgress & Document;


export const SyncProgressSchema = new mongoose.Schema({
  shop: String,
  options: SyncOptionsSchema,
  orders: OrderSyncProgressSchema,
  products: ProductSyncProgressSchema,
  createdAt: Date,
  updatedAt: Date,
  state: String,
  lastError: String,
}, {
  timestamps: true,
});

export type SyncProgressDocument = ISyncProgress & Document & { options: Document, orders: Document, products: Document };
