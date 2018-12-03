export interface ShopifyModuleOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    appHost: string;
    debug: boolean;
    scope: string[];
    plans: any;
    cache: any;
}
