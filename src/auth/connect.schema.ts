import * as mongoose from 'mongoose';
import { ShopifyShopSchema } from '../shop/shop.schema';

export const ShopifyConnectSchema = new mongoose.Schema({
  shopifyID: Number,
  myshopify_domain: String,
  accessToken: String,
  createdAt: Date,
  updatedAt: Date,
  roles: [String],
  shop: ShopifyShopSchema,
});