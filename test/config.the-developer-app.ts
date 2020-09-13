import { ShopifyModuleOptions, Topic } from '../src/interfaces';
import * as redisStore from 'cache-manager-redis';
import { ConfigOptions as ElasticSearchConfigOptions } from 'elasticsearch';
import * as mongoose from 'mongoose';

const app = {
  protocol: 'https',
  host: `next.artandcode.studio`,
  port: 3030,
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

const elasticsearch: ElasticSearchConfigOptions = {
  host: 'localhost:9200',
  log: 'warning',
  requestTimeout: 1000,
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
  host: 'localhost',
  port: 27017,
  username: 'shopify-developer-app',
  password: 'hole-item-meyer-goa-veda-degum-ethel-pta-mommy-diesel',
  database: 'shopify-developer-app',
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

const user = {
  roles: [
    'shopify-staff-member',
  ],
  shopifyID: 12396948,
  myshopify_domain: 'jewelberry-dev.myshopify.com',
  shop: {
    id: 12396948,
    name: 'jewelberry-dev',
    email: 'pascal@jumplink.eu',
    domain: 'jewelberry-dev.myshopify.com',
    province: null,
    country: 'DE',
    address1: 'Bei der Kirche 12',
    zip: '27476',
    city: 'Cuxhaven',
    source: 'jumplink',
    phone: '+4915756431988',
    latitude: '53.8837',
    longitude: '8.673869999999999',
    primary_locale: 'de',
    address2: null,
    created_at: '2016-04-07T07:40:11-04:00',
    country_code: 'DE',
    country_name: 'Germany',
    currency: 'EUR',
    customer_email: 'pascal@jumplink.eu',
    timezone: '(GMT-05:00) Eastern Time (US & Canada)',
    iana_timezone: 'America/New_York',
    shop_owner: 'Moritz Raguschat',
    money_format: '€{{amount}}',
    money_with_currency_format: '€{{amount}} EUR',
    province_code: null,
    taxes_included: true,
    tax_shipping: null,
    county_taxes: true,
    plan_name: 'affiliate',
    has_discounts: false,
    has_gift_cards: false,
    myshopify_domain: 'jewelberry-dev.myshopify.com',
    google_apps_domain: null,
    google_apps_login_enabled: null,
    password_enabled: true,
    has_storefront: true,
    setup_required: false,
    force_ssl: true,
  },
  accessToken: '958bed3b47a08a7003b385e1551fce24',
  updatedAt: new Date ('2019-01-16T16:21:11.455'),
  createdAt: new Date('2018-11-29T19:43:03.964Z'),
};

const config: ShopifyModuleOptions = {
  app,
  charges,
  mongodb,
  redis,
  shopify,
};

export { config, mongooseConnectionPromise, user };

mongooseConnectionPromise
.catch((error) => {
  // tslint:disable-next-line: no-console
  console.error(error);
});