import { Connection, Document, Model, Mongoose, Schema } from 'mongoose';
import { OrderSchema, OrderDocument } from './interfaces/mongoose/order.schema';
import { ProductSchema, ProductDocument } from './interfaces/mongoose/product.schema';
import { CustomerSchema, CustomerDocument } from './interfaces/mongoose/customer.schema';
import { TransactionSchema, TransactionDocument } from './interfaces/mongoose/transaction.schema';
import { ThemeSchema, ThemeDocument } from './interfaces/mongoose/theme.schema';
import { AssetSchema, AssetDocument } from './interfaces/mongoose/asset.schema';
import { PageSchema, PageDocument } from './interfaces/mongoose/page.schema';
import { CustomCollectionSchema, CustomCollectionDocument } from './interfaces/mongoose/custom-collection.schema';
import { SmartCollectionSchema, SmartCollectionDocument } from './interfaces/mongoose/smart-collection.schema';
import { underscoreCase } from '../helpers';

function getDbModel<DocumentType extends Document>(connection: Mongoose, myShopifyDomain: string, resourceName: string, schema: Schema) {
  const shopName = myShopifyDomain.replace('.myshopify.com', '');
  
  const modelName = `shopify_${shopName}:${underscoreCase(resourceName)}`;
  try {
    return <Model<DocumentType>>connection.model(modelName);
  } catch (e) {
    return <Model<DocumentType>>connection.model(modelName, schema);
  }
};

export const shopifyApiProviders = (connection: Mongoose) => {
  return [
    {
      provide: 'OrderModelToken',
      useValue: (myshopifyDomain: string) => getDbModel<OrderDocument>(connection, myshopifyDomain, 'order', OrderSchema),
    },
    {
      provide: 'ProductModelToken',
      useValue: (myshopifyDomain: string) => getDbModel<ProductDocument>(connection, myshopifyDomain, 'product', ProductSchema),
    },
    {
      provide: 'CustomerModelToken',
      useValue: (myshopifyDomain: string) => getDbModel<CustomerDocument>(connection, myshopifyDomain, 'customer', CustomerSchema),
    },
    {
      provide: 'TransactionModelToken',
      useValue: (myshopifyDomain: string) => getDbModel<TransactionDocument>(connection, myshopifyDomain, 'transaction', TransactionSchema),
    },
    {
      provide: 'ThemeModelToken',
      useValue: (myshopifyDomain: string) => getDbModel<ThemeDocument>(connection, myshopifyDomain, 'theme', ThemeSchema),
    },
    {
      provide: 'AssetModelToken',
      useValue: (myshopifyDomain: string) => getDbModel<AssetDocument>(connection, myshopifyDomain, 'asset', AssetSchema),
    },
    {
      provide: 'PageModelToken',
      useValue: (myshopifyDomain: string) => getDbModel<PageDocument>(connection, myshopifyDomain, 'page', PageSchema),
    },
    {
      provide: 'CustomCollectionModelToken',
      useValue: (myshopifyDomain: string) => getDbModel<CustomCollectionDocument>(connection, myshopifyDomain, 'custom_collection', CustomCollectionSchema),
    },
    {
      provide: 'SmartCollectionModelToken',
      useValue: (myshopifyDomain: string) => getDbModel<SmartCollectionDocument>(connection, myshopifyDomain, 'smart_collection', SmartCollectionSchema),
    }
  ];
}

