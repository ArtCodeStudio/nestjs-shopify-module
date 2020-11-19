import { Model, Mongoose } from 'mongoose';
import { ShopifyConnectSchema } from './connect.schema';
import { IShopifyConnectDocument } from './interfaces/connect';

const shopifyConnectProviders = (connection: Mongoose) => {
  return [
    {
      provide: 'ShopifyConnectModelToken',
      useValue: connection.model('shopify_connect', ShopifyConnectSchema) as Model<IShopifyConnectDocument>,
    },
  ];
};

export { shopifyConnectProviders };
