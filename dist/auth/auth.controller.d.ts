import { ShopifyConnectService } from './connect.service';
import { DebugService } from '../debug.service';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
export declare class ShopifyAuthController {
    private readonly shopifyConnectService;
    private readonly shopifyModuleOptions;
    protected logger: DebugService;
    constructor(shopifyConnectService: ShopifyConnectService, shopifyModuleOptions: ShopifyModuleOptions);
    oAuthConnect(shop: any, req: any, res: any, next: any, session: any): any;
    callback(shop: any, req: any, res: any, next: any): any;
    success(shop: any, res: any, req: any): any;
    failure(shop: any, res: any, req: any): any;
    connects(res: any, req: any): Promise<any>;
    connect(id: any, res: any, req: any): Promise<any>;
}
