import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
export declare class ChargeController {
    private readonly shopifyModuleOptions;
    constructor(shopifyModuleOptions: ShopifyModuleOptions);
    protected debug: any;
    activate(name: string, req: any, res: any, session: any): Promise<any>;
    callback(chargeId: any, req: any, res: any): any;
}
