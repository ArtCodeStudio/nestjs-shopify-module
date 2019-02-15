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
import { CollectSchema, CollectDocument } from './interfaces/mongoose/collect.schema';

import { underscoreCase } from '../helpers';

function getDbModel<DocumentType extends Document>(connection: Mongoose, myShopifyDomain: string, resourceName: string, schema: Schema) {
  const shopName = myShopifyDomain.replace('.myshopify.com', '');

  const modelName = `shopify_${shopName}:${underscoreCase(resourceName)}`;
  try {
    return connection.model(modelName) as Model<DocumentType>;
  } catch (e) {
    return connection.model(modelName, schema) as Model<DocumentType>;
  }
}

export const shopifyApiProviders = (connection: Mongoose) => {
  return [
    {
      provide: 'OrderModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<OrderDocument>(connection, myshopifyDomain, 'order', OrderSchema);
      },
    },
    {
      provide: 'ProductModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<ProductDocument>(connection, myshopifyDomain, 'product', ProductSchema);
      },
    },
    {
      provide: 'CustomerModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<CustomerDocument>(connection, myshopifyDomain, 'customer', CustomerSchema);
      },
    },
    {
      provide: 'TransactionModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<TransactionDocument>(connection, myshopifyDomain, 'transaction', TransactionSchema);
      },
    },
    {
      provide: 'ThemeModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<ThemeDocument>(connection, myshopifyDomain, 'theme', ThemeSchema);
      },
    },
    {
      provide: 'AssetModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<AssetDocument>(connection, myshopifyDomain, 'asset', AssetSchema);
      },
    },
    {
      provide: 'PageModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<PageDocument>(connection, myshopifyDomain, 'page', PageSchema);
      },
    },
    {
      provide: 'CustomCollectionModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<CustomCollectionDocument>(connection, myshopifyDomain, 'custom_collection', CustomCollectionSchema);
      },
    },
    {
      provide: 'SmartCollectionModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<SmartCollectionDocument>(connection, myshopifyDomain, 'smart_collection', SmartCollectionSchema);
      },
    },
    {
      provide: 'CollectModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<CollectDocument>(connection, myshopifyDomain, 'collect', CollectSchema);
      },
    },
  ];
};
