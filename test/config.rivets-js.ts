import { ShopifyModuleOptions, Topic } from '../src/interfaces';
import * as redisStore from 'cache-manager-redis';
import * as mongoose from 'mongoose';

const app = {
  protocol: 'https',
  host: `nest-shopify.artandcode.studio`,
  port: 3038,
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
  auth_pass: 'habib-poet-pew-divan',
  port: 6379,
  ttl: 1, // second
  max: 100,
};

/**
 * Create user and with
 * ```
 *  > mongo
 *  use admin
 *  db.createUser({user:"nest-shopify", pwd:"bore-hydra-benign-barber-dispose-bulginess", roles:[{role:"root", db:"admin"}]})
 *  exit
 * ```
 */
const mongodb = {
  host: 'localhost',
  port: 27017,
  username: 'nest-shopify',
  password: 'bore-hydra-benign-barber-dispose-bulginess',
  database: 'nest-shopify',
};

const mongooseConnectionPromise: Promise<typeof mongoose> = mongoose.connect(
  `mongodb://${mongodb.username}:${mongodb.password}@${mongodb.host}:${mongodb.port}/${mongodb.database}`,
  {
    useNewUrlParser: true,
    user: mongodb.username,
    pass:  mongodb.password,
    dbName: mongodb.database,
    auth: {
      authdb: 'admin',
    },
  },
);

const config: ShopifyModuleOptions = {
  app,
  charges,
  mongodb,
  redis,
  shopify,
};

export { config, mongooseConnectionPromise };

mongooseConnectionPromise
.catch((error) => {
  // tslint:disable-next-line: no-console
  console.error(error);
});