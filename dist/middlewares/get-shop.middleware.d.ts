import { NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';
export declare class GetShopMiddleware implements NestMiddleware {
    private readonly shopifyAuthService;
    private readonly shopifyConnectService;
    logger: DebugService;
    constructor(shopifyAuthService: ShopifyAuthService, shopifyConnectService: ShopifyConnectService);
    resolve(...args: any[]): Promise<MiddlewareFunction>;
}
