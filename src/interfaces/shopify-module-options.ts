import { IPlan } from '../charge/interfaces/plan';
import { Topic } from '../interfaces/webhook';
import * as redisStore from 'cache-manager-ioredis';
import { Redis } from 'ioredis';

export interface ShopifyModuleOptions {

  app: {
    protocol: string;
    host: string;
    port: number;
    debug: boolean;
    environment: 'production' | 'development' | 'test';
  };

  shopify: {
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
      autoSubscribe: Topic[];
    };
  };

  charges: {
    plans: IPlan[];
    frontend_return_url: string;
  };

  /**
   * Cache manager options
   * @see https://github.com/BryanDonovan/node-cache-manager
   */
  cache: {
    store: 'memory' | typeof redisStore;
    ttl: number;
    max: number;
    [Key: string]: any;
  }

  redis?: {
    host: string;
    auth_pass: string;
    username?: string;
    port: number;
  };

  mongodb: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    /** Optional MongoDB connection string */
    url?: string;
  };

}