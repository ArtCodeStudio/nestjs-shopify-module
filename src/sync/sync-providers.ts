import { Schema, Document, Model, Mongoose } from 'mongoose';
import { 
  SyncProgressSchema, SyncProgressDocument,
  OrderSyncProgressSchema, OrderSyncProgressDocument,
  ProductSyncProgressSchema, ProductSyncProgressDocument,
 } from './sync-progress.schema';


function getDbModel<DocumentType extends Document>(connection: Mongoose, myShopifyDomain: string, resourceName: string, schema: Schema) {
  const shopName = myShopifyDomain.replace('.myshopify.com', '');
  const modelName = `shopify-${shopName}:${resourceName}`;
  try {
    return <Model<DocumentType>>connection.model(modelName);
  } catch (e) {
    return <Model<DocumentType>>connection.model(modelName, schema);
  }
};

const syncProviders = (connection: Mongoose) => {
  return [
    {
      provide: 'SyncProgressModelToken',
      useValue: (myshopifyDomain) => getDbModel<SyncProgressDocument>(connection, myshopifyDomain, 'sync_progress', SyncProgressSchema),
    },
    {
      provide: 'OrderSyncProgressModelToken',
      useValue: (myshopifyDomain) => getDbModel<OrderSyncProgressDocument>(connection, myshopifyDomain, 'order_sync_progress', OrderSyncProgressSchema),
    },
    {
      provide: 'ProductSyncProgressModelToken',
      useValue: (myshopifyDomain) => getDbModel<ProductSyncProgressDocument>(connection, myshopifyDomain, 'product_sync_progress', ProductSyncProgressSchema),
    },
  ];
}

export { syncProviders };