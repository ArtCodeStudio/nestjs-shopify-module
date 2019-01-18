import { ShopifyModuleOptions, Topic } from '../src/interfaces';
import * as redisStore from 'cache-manager-redis';
import { ConfigOptions as ElasticSearchConfigOptions } from 'elasticsearch';
import * as mongoose from 'mongoose';

const app = {
  protocol: 'https',
  host: '127.0.0.1',
  port: 3000,
  debug: true,
  environment: 'test' as 'production' | 'development' | 'test',
};

const charges = {
  plans: [
    {
      // The default charge
      name: 'Default',
      price: 29.00,
      test: true,
      trial_days: 14,
      return_url: `${app.protocol}://${app.host}/shopify/charge/activate`,
      visible: true,
    },
    {
      // Charge for special customers with a cheaper price
      name: 'Customers',
      price: 19.00,
      test: true,   // Marks this charge as a test, meaning it won't charge the shop owner.
      trial_days: 0, // Don't charge the user for 0 days
      return_url: `${app.protocol}://${app.host}/shopify/charge/activate`,
      visible: false, // Not visible to everyone
    },
  ],
  // Return url after the charge was activated (or not)
  frontend_return_url: `${app.protocol}://${app.host}/view/settings`,
};

/**
 * Create user and with
 * ```
 *  > mongo
 *  use admin
 *  db.createUser({user:"tester", pwd:"tester", roles:[{role:"root", db:"admin"}]})
 *  exit
 * ```
 */
const mongodb = {
  host: '127.0.0.1',
  port: 27017,
  username: 'tester',
  password: 'tester',
  database: 'nest-shopify',
};

const shopify = {
  /** client id / Api key */
  clientID: `94377b1fd8dc004a658b8abc53e993be`,
  /**  shared secret / client Secret / API secret key */
  clientSecret: `98fa8cb68d8d6f88afe983500f415dad`,
  /** callback url / redirect url */
  callbackURL: `${app.protocol}://${app.host}/shopify/auth/callback`,
  /** callback url used in shopify iframe */
  iframeCallbackURL: `${app.protocol}://${app.host}/shopify/auth/callback/iframe`,
  scope: ['read_themes', 'write_themes', 'read_products', 'write_products', 'read_content', 'write_content'],
  webhooks: {
    autoSubscribe: [
      // 'carts/create',
      // 'carts/update',
      // 'checkouts/create',
      // 'checkouts/update',
      // 'checkouts/delete',
      // 'collections/create',
      // 'collections/update',
      // 'collections/delete',
      // 'collection_listings/add',
      // 'collection_listings/remove',
      // 'collection_listings/update',
      // 'customers/create',
      // 'customers/disable',
      // 'customers/enable',
      // 'customers/update',
      // 'customers/delete',
      // 'customer_groups/create',
      // 'customer_groups/update',
      // 'customer_groups/delete',
      // 'draft_orders/create',
      // 'draft_orders/update',
      // 'fulfillments/create',
      // 'fulfillments/update',
      // 'fulfillment_events/create',
      // 'fulfillment_events/delete',
      // 'inventory_items/create',
      // 'inventory_items/update',
      // 'inventory_items/delete',
      // 'inventory_levels/connect',
      // 'inventory_levels/update',
      // 'inventory_levels/disconnect',
      // 'locations/create',
      // 'locations/update',
      // 'locations/delete',
      // 'orders/cancelled',
      // 'orders/create',
      // 'orders/fulfilled',
      // 'orders/paid',
      // 'orders/partially_fulfilled',
      // 'orders/updated',
      // 'orders/delete',
      // 'order_transactions/create',
      'products/create',
      'products/update',
      'products/delete',
      // 'product_listings/add',
      // 'product_listings/remove',
      // 'product_listings/update',
      // 'refunds/create',
      // 'app/uninstalled',
      'shop/update',
      'themes/create',
      'themes/publish',
      'themes/update',
      'themes/delete',
    ] as Topic[],
  },
};

const redis = {
  store: redisStore,
  host: 'localhost',
  auth_pass: 'tester',
  port: 6379,
  ttl: 1, // second
  max: 100,
};

const elasticsearch: ElasticSearchConfigOptions = {
  host: 'localhost:9200',
  log: 'warning',
  requestTimeout: 1000,
};

const config: ShopifyModuleOptions = {
  app,
  charges,
  elasticsearch,
  mongodb,
  redis,
  shopify,
};

const mongooseConnectionPromise: Promise<typeof mongoose> = mongoose.connect(
  `mongodb://${mongodb.host}:${mongodb.port}`,
  {
    useNewUrlParser: true,
    user: mongodb.username,
    pass:  mongodb.password,
    dbName: mongodb.database,
  },
);

export { config, mongooseConnectionPromise };

mongooseConnectionPromise
.catch((error) => {
  // tslint:disable-next-line: no-console
  console.error(error);
});