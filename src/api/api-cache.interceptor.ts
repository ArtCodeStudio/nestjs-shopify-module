import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import {
  Inject,
  Injectable,
  Optional,
  ExecutionContext,
  CallHandler,
  HttpServer,
  NestInterceptor,
  CACHE_KEY_METADATA,
  CACHE_MANAGER,
  CACHE_TTL_METADATA,
} from "@nestjs/common";

import { DebugService } from "../debug.service";
import { ShopifyAuthService } from "../auth/auth.service";

const HTTP_ADAPTER_HOST = "HttpAdapterHost";
const REFLECTOR = "Reflector";

const isNil = (obj: any): obj is null | undefined =>
  typeof obj === "undefined" || obj === null;

export interface HttpAdapterHost<T extends HttpServer = any> {
  httpAdapter: T;
}

@Injectable()
export class ApiCacheInterceptor implements NestInterceptor {
  @Optional()
  @Inject(HTTP_ADAPTER_HOST)
  protected readonly httpAdapterHost: HttpAdapterHost;

  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: any,
    @Inject(REFLECTOR) protected readonly reflector: any,
    private readonly shopifyAuthService: ShopifyAuthService
  ) {}

  logger = new DebugService(`shopify:ApiCacheInterceptor`);

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const key = await this.trackBy(context);
    const ttlValueOrFactory =
      this.reflector.get(CACHE_TTL_METADATA, context.getHandler()) || null;

    if (!key) {
      return next.handle();
    }
    try {
      const value = await this.cacheManager.get(key);
      if (!isNil(value)) {
        this.logger.debug(`cache hit for ${key}`);
        return of(value);
      }
      this.logger.debug(`cache miss for ${key}`);
      const ttl =
        typeof ttlValueOrFactory === "function"
          ? await ttlValueOrFactory(context)
          : ttlValueOrFactory;
      return next.handle().pipe(
        tap((response) => {
          if (
            !(response["response"] !== undefined && response["response"].errors)
          ) {
            const args = isNil(ttl)
              ? [key, response]
              : [key, response, { ttl }];
            this.cacheManager.set(...args);
          }
        })
      );
    } catch (error) {
      this.logger.error(`cache error for ${key}`, error);
      return next.handle();
    }
  }

  async trackBy(context: ExecutionContext): Promise<string | undefined> {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const isHttpApp = httpAdapter && !!httpAdapter.getRequestMethod;
    const cacheMetadata = this.reflector.get(
      CACHE_KEY_METADATA,
      context.getHandler()
    );

    if (!isHttpApp || cacheMetadata) {
      return cacheMetadata;
    }

    const request = context.getArgByIndex(0);
    if (httpAdapter.getRequestMethod(request) !== "GET") {
      return undefined;
    }
    let key = httpAdapter.getRequestUrl(request);

    const shop = await this.shopifyAuthService.getMyShopifyDomainSecureForThemeClients(
      request
    );
    key = `${shop}:${key}`;
    this.logger.debug(`trackBy cache by ${key}`);
    return key;
  }
}
