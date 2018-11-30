import { RecurringCharges, Models } from 'shopify-prime';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
export declare class ChargeService extends RecurringCharges {
    private readonly shopifyModuleOptions;
    protected return_url: string;
    constructor(shopDomain: string, shopAccessToken: string, shopifyModuleOptions: ShopifyModuleOptions);
    private getPlanByName(name);
    createByName(planName?: string): Promise<Models.RecurringCharge>;
    activate(id?: number): Promise<void>;
}
