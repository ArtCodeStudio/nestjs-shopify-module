import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IUserRequest } from '../interfaces/user-request';
import { ShopifyConnectService } from '../auth/connect.service';
import { ShopifyAuthService } from '../auth/auth.service';
import { DebugService } from '../debug.service';
declare class ShopifyApiGuard implements CanActivate {
    private readonly shopifyConnectService;
    private readonly shopifyAuthService;
    protected logger: DebugService;
    constructor(shopifyConnectService: ShopifyConnectService, shopifyAuthService: ShopifyAuthService);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    validateRequest(request: IUserRequest): false | Promise<boolean>;
}
export { ShopifyApiGuard };
