import { Connection, Document, Model } from 'mongoose';
import { ShopifyConnectSchema } from './connect.schema';
import { IShopifyConnect } from './interfaces/connect'

const shopifyConnectProviders = [
  {
    provide: 'ShopifyConnectModelToken',
    useFactory: (connection: Connection): Model<IShopifyConnect> => connection.model('shopify_connect', ShopifyConnectSchema),
    inject: ['defaultDatabase'],
  },
];

export { shopifyConnectProviders };
