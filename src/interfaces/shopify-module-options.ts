import { IPlan } from '../charge/interfaces/plan';
import { Enums } from 'shopify-admin-api';
import * as redisStore from 'cache-manager-ioredis';
import { Redis } from 'ioredis';

export interface ConfigApp {
  root: string;
  protocol: 'https' | 'http';
  host: string;
  port: number;
  debug: boolean;
  environment: 'production' | 'development' | 'test';
}

export interface ConfigShopify {
  /** client id / Api key */
  clientID: string;
  /**  shared secret / client Secret / API secret key */
  clientSecret: string;
  /** callback url / redirect url */
  callbackURL: string;
  /** callback url used in shopify iframe */
  iframeCallbackURL: string;
  // successRedirectURL?: string;
  // failureRedirectURL?: string;
  scope: string[];
  webhooks: {
    autoSubscribe: Enums.WebhookTopic[];
  };
}

export interface ConfigCharges {
  plans: IPlan[];
  frontend_return_url: string;
}

export interface ConfigCache {
  store: 'memory' | typeof redisStore;
  ttl: number;
  max: number;
  [Key: string]: any;
}

export interface ConfigRedis {
  host?: string;
  auth_pass?: string;
  username?: string;
  port?: number;
  url?: string;
}

export interface ConfigMongoDB {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  /** Optional MongoDB connection string */
  url?: string;
}
export interface ShopifyModuleOptions {

  app: ConfigApp;

  shopify: ConfigShopify;

  charges: ConfigCharges;

  /**
   * Cache manager options
   * @see https://github.com/BryanDonovan/node-cache-manager
   */
  cache: ConfigCache;

  redis?: ConfigRedis;

  mongodb: ConfigMongoDB;

}