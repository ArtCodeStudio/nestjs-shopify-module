import { Schema, Document } from 'mongoose';
import { ISyncProgress } from '../sync-progress';
import { ISubSyncProgress, IOrderSyncProgress, IBlogSyncProgress } from '../sub-sync-progress';

export const SyncOptionsSchema = new Schema({
  includeOrders: Boolean,
  includeTransactions: Boolean,
  includeBlogs: Boolean,
  includeArticles: Boolean,
  includeProducts: Boolean,
  includePages: Boolean,
  includeSmartCollections: Boolean,
  includeCustomCollections: Boolean,
  resync: Boolean,
  cancelExisting: Boolean,
});

export const SubSyncProgressSchema = new Schema({
  info: String,
  shop: String,
  shopifyCount: Number,
  syncedCount: Number,
  sinceId: Number,
  lastId: Number,
  createdAt: Date,
  updatedAt: Date,
  state: String,
  error: String,

  continuedFromPrevious: { type: Schema.Types.ObjectId, ref: 'shopify_sync-progress' },
}, {
  timestamps: true,
});

export type SubSyncProgressDocument = ISubSyncProgress & Document;

export const OrderSyncProgressSchema = new Schema({
  info: String,
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

  continuedFromPrevious: { type: Schema.Types.ObjectId, ref: 'shopify_sync-progress' },
}, {
  timestamps: true,
});

export type OrderSyncProgressDocument = IOrderSyncProgress & Document;

export type BlogSyncProgressDocument = IBlogSyncProgress & Document;

export const SyncProgressSchema = new Schema({
  shop: String,
  options: SyncOptionsSchema,
  orders: OrderSyncProgressSchema,
  products: SubSyncProgressSchema,
  pages: SubSyncProgressSchema,
  smartCollections: SubSyncProgressSchema,
  customCollections: SubSyncProgressSchema,
  createdAt: Date,
  updatedAt: Date,
  state: String,
  lastError: String,
}, {
  timestamps: true,
});

export type SyncProgressDocument = ISyncProgress & Document & { options: Document, orders: Document, products: Document };
