import { Connection, Document, Model, Mongoose } from 'mongoose';
import { OrderSchema, OrderDocument} from './interfaces/order.schema';
import { ProductSchema, ProductDocument} from './interfaces/product.schema';
import { CustomerSchema, CustomerDocument } from './interfaces/customer.schema';
import { TransactionSchema, TransactionDocument} from './interfaces/transaction.schema';
import { ThemeSchema, ThemeDocument} from './interfaces/theme.schema';
import { AssetSchema, AssetDocument} from './interfaces/asset.schema';

export const shopifyApiProviders = (connection: Mongoose) => {
  return [
    {
      provide: 'OrderModelToken',
      useValue: <Model<OrderDocument>> connection.model('shopify_order', OrderSchema),
    },
    {
      provide: 'ProductModelToken',
      useValue: <Model<ProductDocument>> connection.model('shopify_product', ProductSchema),
    },
    {
      provide: 'CustomerModelToken',
      useValue: <Model<CustomerDocument>> connection.model('shopify_customer', CustomerSchema),
    },
    {
      provide: 'TransactionModelToken',
      useValue: <Model<TransactionDocument>> connection.model('shopify_transaction', TransactionSchema),
    },
    {
      provide: 'ThemeModelToken',
      useValue: <Model<ThemeDocument>> connection.model('shopify_theme', ThemeSchema),
    },
    {
      provide: 'AssetModelToken',
      useValue: <Model<AssetDocument>> connection.model('shopify_asset', AssetSchema),
    },
  ];
}

