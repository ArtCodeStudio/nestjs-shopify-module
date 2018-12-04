import { IPlan } from '../charge/interfaces/plan';

export interface ShopifyModuleOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  appHost: string;
  debug: boolean;
  scope: string[];
  charges: {
    plans: IPlan[];
    frontend_return_url: string;
  };
  cache: any;
}