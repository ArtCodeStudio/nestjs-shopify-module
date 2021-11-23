import { Schema } from 'mongoose';
import { ShopifyShopSchema } from '../shop/shop.schema';

export const ShopifyConnectSchema = new Schema({
  shopifyID: Number,
  myshopify_domain: String,
  accessToken: String,
  createdAt: Date,
  updatedAt: Date,
  roles: [],
  shop: ShopifyShopSchema,
});
