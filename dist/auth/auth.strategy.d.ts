import { ShopifyConnectService } from './connect.service';
import { DebugService } from '../debug.service';
import { ShopifyAuthController } from './auth.controller';
import { IShopifyAuthProfile } from './interfaces/profile';
import { IShopifyConnect } from '../interfaces/user-request';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
declare const ShopifyAuthStrategy_base: new (...args: any[]) => any;
export declare class ShopifyAuthStrategy extends ShopifyAuthStrategy_base {
    private shopifyConnectService;
    private readonly shopifyModuleOptions;
    protected logger: DebugService;
    protected authController: ShopifyAuthController;
    constructor(shop: string, shopifyConnectService: ShopifyConnectService, shopifyModuleOptions: ShopifyModuleOptions);
    validate(accessToken: any, refreshToken: any, profile: IShopifyAuthProfile, done: any): Promise<any>;
    serializeUser(user: IShopifyConnect, done: any): any;
    deserializeUser(id: number, done: any): Promise<any>;
    authenticate(req: any, options: any): any;
}
