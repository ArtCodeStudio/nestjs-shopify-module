import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IUserRequest, IShopifyConnect } from '../interfaces/user-request';
import { TRoles } from '../auth/interfaces/role';
import { DebugService } from '../debug.service';
export declare class RolesGuard implements CanActivate {
    private readonly reflector;
    protected logger: DebugService;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    isLoggedIn(request: IUserRequest): boolean;
    hasRole(user: IShopifyConnect, roles: TRoles): boolean;
    validateRequest(request: IUserRequest, roles: any): boolean;
}
