import { Module, CacheModule, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ShopifyAuthController } from './auth/auth.controller';
import { shopifyConnectProviders } from './auth/connect.providers';
import { ShopifyConnectService } from './auth/connect.service';
import { ChargeController } from './charge/charge.controller';
import { ChargeService } from './charge/charge.service';
import { ShopController } from './shop/shop.controller';
import { ShopService } from './shop/shop.service';
import { IShopifyShop } from './shop/interfaces/shop';
import { ApiCacheInterceptor } from './api/api-cache.interceptor';
import { databaseProviders } from 'database.providers';
import { ConfigService } from 'config.service';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './guards/roles.decorator';
import { ShopifyApiGuard } from './guards/shopify-api.guard';
import { ApiController } from './api/api.controller';
import { ShopifyThemeService } from './api/theme/theme.service';
import { ThemeController } from './api/theme/theme.controller';
import { ShopifyAuthService } from './auth/auth.service';
import { ShopifyThemeAssetService } from './api/theme/assets/assets.service';
import { AssetsController } from './api/theme/assets/assets.controller';
import { LocalesController } from './api/theme/locales/locales.controller';
import { GetShopMiddleware } from './middlewares/get-shop.middleware';
import { SyncService } from './sync/sync.service';
import { OrdersService } from './api/orders/orders.service';
import { ProductsService } from './api/products/products.service';
import { OrdersController } from './api/orders/orders.controller';
import { ProductsController } from './api/products/products.controller';

@Module({
  imports: [
    CacheModule.register(ConfigService.cache),
  ],
  providers: [
    // inectable guard
    ShopifyApiGuard,
    // global guard for all controllers
    // RolesGuard,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    ChargeService,
    ShopifyConnectService,
    ShopService,
    ...databaseProviders,
    ...shopifyConnectProviders,
    ApiCacheInterceptor,
    ShopifyAuthService,
    SyncService,
    OrdersService,
    ProductsService,
  ],
  controllers: [ShopifyAuthController, ChargeController, ShopController, ApiController, ThemeController, AssetsController, LocalesController, OrdersController, ProductsController],
  exports: [ShopifyConnectService, ShopifyApiGuard, ApiCacheInterceptor, ShopifyAuthService],
})
export class ShopifyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetShopMiddleware)
      .with('ShopifyModule')
      .forRoutes(ApiController)

      .apply(GetShopMiddleware)
      .with('ShopifyModule')
      .forRoutes(ThemeController)

      .apply(GetShopMiddleware)
      .with('ShopifyModule')
      .forRoutes(AssetsController)

      .apply(GetShopMiddleware)
      .with('ShopifyModule')
      .forRoutes(LocalesController);
  }
}
