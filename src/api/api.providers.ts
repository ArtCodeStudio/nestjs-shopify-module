import { Connection, Document, Model, Mongoose, Schema } from 'mongoose';
import { OrderSchema, OrderDocument} from './interfaces/mongoose/order.schema';
import { ProductSchema, ProductDocument} from './interfaces/mongoose/product.schema';
import { CustomerSchema, CustomerDocument } from './interfaces/mongoose/customer.schema';
import { TransactionSchema, TransactionDocument} from './interfaces/mongoose/transaction.schema';
import { ThemeSchema, ThemeDocument} from './interfaces/mongoose/theme.schema';
import { AssetSchema, AssetDocument} from './interfaces/mongoose/asset.schema';
import { PageSchema, PageDocument} from './interfaces/mongoose/page.schema';

function getDbModel<DocumentType extends Document>(connection: Mongoose, myShopifyDomain: string, resourceName: string, schema: Schema) {
  const shopName = myShopifyDomain.replace('.myshopify.com', '');
  const modelName = `shopify_${shopName}:${resourceName}`;
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
    {
      provide: 'PageModelToken',
      useValue: (myshopifyDomain) => getDbModel<PageDocument>(connection, myshopifyDomain, 'page', PageSchema),
    }
  ];
}

