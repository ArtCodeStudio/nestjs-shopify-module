import * as mongoose from 'mongoose';
import { Schema, Document } from 'mongoose';

export interface IOrderSyncProgress {
  shopifyCount: number,
  syncedCount: number,
  sinceId: number,
  lastId: number,
  includeTransactions: Boolean,
  createdAt: Date,
  updatedAt: Date,
  error: string | null,
  state: string,
}

export interface IProductSyncProgress {
  shopifyCount: number,
  syncedCount: number,
  sinceId: number,
  lastId: number,
  createdAt: Date,
  updatedAt: Date,
  error: string | null,
  state: string,
}

export interface ISyncProgress {
  orders: IOrderSyncProgress,
  products: IProductSyncProgress,
  createdAt: Date,
  updatedAt: Date,
  state: string,
  error: string | null
}

export type SyncProgressDocument = ISyncProgress & Document;

export type OrderSyncProgressDocument = IOrderSyncProgress & Document;

export type ProductSyncProgressDocument = IProductSyncProgress & Document;

export const OrderSyncProgressSchema = new mongoose.Schema({
  shopifyCount: Number,
  syncedCount: Number,
  sinceId: Number,
  lastId: Number,

  includeTransactions: Boolean,

  createdAt: Date,
  updatedAt: Date,
  state: String,
  error: String,
});

export const ProductSyncProgressSchema = new mongoose.Schema({
  shopifyCount: Number,
  syncedCount: Number,
  sinceId: Number,
  lastId: Number,

  createdAt: Date,
  updatedAt: Date,
  state: String,
  error: String,
});

export const SyncProgressSchema = new mongoose.Schema({
  orders: OrderSyncProgressSchema,
  products: ProductSyncProgressSchema,
  createdAt: Date,
  updatedAt: Date,
  state: String,
  error: String,
});
