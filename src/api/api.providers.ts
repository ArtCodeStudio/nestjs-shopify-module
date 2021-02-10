import { Document, Model, Mongoose, Schema } from 'mongoose';
import {
  OrderSchema,
  OrderDocument,
  ProductSchema,
  ProductDocument,
  ProductVariantSchema,
  ProductVariantDocument,
  CheckoutSchema,
  CheckoutDocument,
  CustomerSchema,
  CustomerDocument,
  TransactionSchema,
  TransactionDocument,
  ThemeSchema,
  ThemeDocument,
  AssetSchema,
  AssetDocument,
  PageSchema,
  PageDocument,
  BlogSchema,
  BlogDocument,
  ArticleSchema,
  ArticleDocument,
  CustomCollectionSchema,
  CustomCollectionDocument,
  SmartCollectionSchema,
  SmartCollectionDocument,
  CollectSchema,
  CollectDocument,
} from './interfaces';

import { ResourceSignular } from '../interfaces';

import { underscoreCase, getSubdomain } from '../helpers';

function getDbModel<DocumentType extends Document>(connection: Mongoose, myShopifyDomain: string, resourceName: ResourceSignular, schema: Schema) {
  const shopName = getSubdomain(myShopifyDomain);

  const modelName = `shopify_${shopName}:${underscoreCase(resourceName)}`;
  try {
    return connection.model(modelName) as Model<DocumentType>;
  } catch (e) {
    return connection.model(modelName, schema) as unknown as Model<DocumentType>;
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
      provide: 'ProductVariantModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<ProductVariantDocument>(connection, myshopifyDomain, 'product_variant', ProductVariantSchema);
      },
    },
    {
      provide: 'CheckoutModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<CheckoutDocument>(connection, myshopifyDomain, 'checkout', CheckoutSchema);
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
      provide: 'BlogModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<BlogDocument>(connection, myshopifyDomain, 'blog', BlogSchema);
      },
    },
    {
      provide: 'ArticleModelToken',
      useValue: (myshopifyDomain: string) => {
        return getDbModel<ArticleDocument>(connection, myshopifyDomain, 'article', ArticleSchema);
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
