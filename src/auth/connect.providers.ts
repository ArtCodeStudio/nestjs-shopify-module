import { Connection, Document, Model, Mongoose } from 'mongoose';
import { ShopifyConnectSchema } from './connect.schema';
import { IShopifyConnect } from './interfaces/connect'

const shopifyConnectProviders = (connection: Mongoose) => {
  return [
    {
      provide: 'ShopifyConnectModelToken',
      useValue: <Model<IShopifyConnect>> connection.model('shopify_connect', ShopifyConnectSchema),
    },
  ];
}


export { shopifyConnectProviders };
