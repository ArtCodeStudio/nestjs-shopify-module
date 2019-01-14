import { Inject, CACHE_MANAGER, Injectable, CacheInterceptor, ExecutionContext } from '@nestjs/common';
import { DebugService } from 'debug.service';
import { ShopifyAuthService } from '../auth/auth.service'

@Injectable()
export class ApiCacheInterceptor extends CacheInterceptor {

  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: any,
    @Inject('Reflector') protected readonly reflector,
    private readonly shopifyAuthService: ShopifyAuthService
  ) {
    // see https://github.com/nestjs/nest/blob/master/packages/common/cache/interceptors/cache.interceptor.ts
    super(cacheManager, reflector);
  }

  logger = new DebugService(`shopify:ApiCacheInterceptor`);

  /**
   * Cache by url and host
   * @param context
   */
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.getArgByIndex(0);
    let key = super.trackBy(context);
    if (!key) {
      return undefined;
    }
    let shop = this.shopifyAuthService.getMyShopifyDomainSecureForThemeClients(request);
    key = `${shop}:${key}`;
    this.logger.debug(`trackBy cache by ${key}`);
    return key;
  }
}