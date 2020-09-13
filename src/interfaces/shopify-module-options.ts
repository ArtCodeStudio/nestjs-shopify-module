import { IPlan } from '../charge/interfaces/plan';
import { Topic } from '../interfaces/webhook';

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

  redis: {
    store: any;
    host: string;
    auth_pass: string;
    port: number;
    ttl: number;
    max: number;
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