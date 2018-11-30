import { IUserRequest } from '../interfaces/user-request';
import { DebugService } from '../debug.service';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
export declare class ShopifyAuthService {
    private readonly shopifyModuleOptions;
    constructor(shopifyModuleOptions: ShopifyModuleOptions);
    protected logger: DebugService;
    isLoggedIn(request: IUserRequest): boolean;
    getClientHost(request: any): any;
    getShop(request: IUserRequest): any;
}
