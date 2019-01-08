import * as mongoose from 'mongoose';
import { Schema, Document } from 'mongoose';

export interface IOrderSyncOptions {
  resync?: boolean,
  includeTransactions?: boolean,
  attachToExisting?: boolean,
  cancelExisting?: boolean,
}

export interface IProductSyncOptions {
  resync?: boolean,
  attachToExisting?: boolean,
  cancelExisting?: boolean,
}

export interface ISyncOptions {
  includeOrders: boolean,
  includeTransactions: boolean,
  includeProducts: boolean,
  resync: boolean,
  cancelExisting: boolean,
}

export const SyncOptionsSchema = new mongoose.Schema({
  includeOrders: Boolean,
  includeTransactions: Boolean,
  includeProducts: Boolean,
  resync: Boolean,
  cancelExisting: Boolean,
});

export interface IOrderSyncProgress {
  shop: string,
  includeTransactions: boolean,
  shopifyCount: number,
  syncedCount: number,
  syncedTransactionsCount: number,
  sinceId: number,
  lastId: number,
  createdAt: Date,
  updatedAt: Date,
  error: string | null,
  state: string,
  continuedFromPrevious?: Schema.Types.ObjectId,
}

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


export interface IProductSyncProgress {
  shop: string,
  shopifyCount: number,
  syncedCount: number,
  sinceId: number,
  lastId: number,
  createdAt: Date,
  updatedAt: Date,
  error: string | null,
  state: string,
  continuedFromPrevious?: Schema.Types.ObjectId,
}

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

export interface ISyncProgress {
  shop: String,
  options: ISyncOptions,
  orders?: IOrderSyncProgress,
  products?: IProductSyncProgress,
  createdAt: Date,
  updatedAt: Date,
  state: string,
  lastError: string | null,
}

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
