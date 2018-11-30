import { CacheInterceptor, ExecutionContext } from '@nestjs/common';
import { DebugService } from 'debug.service';
export declare class ApiCacheInterceptor extends CacheInterceptor {
    logger: DebugService;
    getClientHost(request: any): any;
    isLoggedIn(request: any): boolean;
    trackBy(context: ExecutionContext): string | undefined;
}
