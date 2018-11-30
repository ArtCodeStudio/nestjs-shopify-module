import { DebugService } from '../../../debug.service';
import { ShopifyConnectService } from '../../../auth/connect.service';
import { ShopifyModuleOptions } from '../../../interfaces/shopify-module-options';
import { Cache } from '../../api-cache.d';
export declare class LocalesController {
    private readonly shopifyConnectService;
    private readonly shopifyModuleOptions;
    logger: DebugService;
    redisCache: Cache;
    constructor(shopifyConnectService: ShopifyConnectService, shopifyModuleOptions: ShopifyModuleOptions);
    getFullLocale(req: any, res: any, themeId: number): Promise<any>;
    listLocales(req: any, res: any, themeId: number): Promise<any>;
    getLocale(req: any, res: any, themeId: number, filename: string): Promise<any>;
    getSectionLocale(req: any, res: any, themeId: number, filename: string): Promise<any>;
    getFullLocaleByProperty(req: any, res: any, themeId: number, propertyPath: string): Promise<any>;
}
