import { Connection, Document, Model, Mongoose, Schema } from 'mongoose';
import { OrderSchema, OrderDocument} from './interfaces/order.schema';
import { ProductSchema, ProductDocument} from './interfaces/product.schema';
import { CustomerSchema, CustomerDocument } from './interfaces/customer.schema';
import { TransactionSchema, TransactionDocument} from './interfaces/transaction.schema';
import { ThemeSchema, ThemeDocument} from './interfaces/theme.schema';
import { AssetSchema, AssetDocument} from './interfaces/asset.schema';

function getDbModel<DocumentType extends Document>(connection: Mongoose, shopName: string, resourceName: string, schema: Schema) {
  const modelName = `shopify-${shopName}:${resourceName}`;
  try {
    return <Model<DocumentType>>connection.model(modelName);
  } catch (e) {
    return <Model<DocumentType>>connection.model(modelName, schema);
  }
};

export const shopifyApiProviders = (connection: Mongoose) => {
  return [
    {
      provide: 'DbModelToken',
      useValue: (myshopifyDomain: string, resourceName: string, schema?: Schema) => getDbModel(connection, myshopifyDomain.replace('.myshopify.com', ''), resourceName, schema),
    },
    {
      provide: 'OrderModelToken',
      useValue: (myshopifyDomain) => getDbModel<OrderDocument>(connection, myshopifyDomain, 'order', OrderSchema),
    },
    {
      provide: 'ProductModelToken',
      useValue: (myshopifyDomain) => getDbModel<ProductDocument>(connection, myshopifyDomain, 'product', ProductSchema),
    },
    {
      provide: 'CustomerModelToken',
      useValue: (myshopifyDomain) => getDbModel<CustomerDocument>(connection, myshopifyDomain, 'customer', CustomerSchema),
    },
    {
      provide: 'TransactionModelToken',
      useValue: (myshopifyDomain) => getDbModel<TransactionDocument>(connection, myshopifyDomain, 'transaction', TransactionSchema),
    },
    {
      provide: 'ThemeModelToken',
      useValue: (myshopifyDomain) => getDbModel<ThemeDocument>(connection, myshopifyDomain, 'theme', ThemeSchema),
    },
    {
      provide: 'AssetModelToken',
      useValue: (myshopifyDomain) => getDbModel<AssetDocument>(connection, myshopifyDomain, 'asset', AssetSchema),
    },
  ];
}

