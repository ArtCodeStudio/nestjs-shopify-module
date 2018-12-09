import { Module, DynamicModule, CacheModule, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ShopifyAuthController } from './auth/auth.controller';
import { shopifyConnectProviders } from './auth/connect.providers';
import { shopifyApiProviders } from './api/api.providers';
import { ShopifyConnectService } from './auth/connect.service';
import { ChargeController } from './charge/charge.controller';
import { ChargeService } from './charge/charge.service';
import { ShopController } from './shop/shop.controller';
import { ShopService } from './shop/shop.service';
import { IShopifyShop } from './shop/interfaces/shop';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './guards/roles.decorator';
import { ShopifyApiGuard } from './guards/shopify-api.guard';
import { ThemesService } from './api/themes/themes.service';
import { ThemesController } from './api/themes/themes.controller';
import { ShopifyAuthService } from './auth/auth.service';
import { AssetsService } from './api/themes/assets/assets.service';
import { LocalesService } from './api/themes/locales/locales.service';
import { AssetsController } from './api/themes/assets/assets.controller';
import { LocalesController } from './api/themes/locales/locales.controller';
import { GetShopMiddleware } from './middlewares/get-shop.middleware';
import { SyncService } from './sync/sync.service';
import { OrdersService } from './api/orders/orders.service';
import { ProductsService } from './api/products/products.service';
import { OrdersController } from './api/orders/orders.controller';
import { ProductsController } from './api/products/products.controller';
import { SHOPIFY_MODULE_OPTIONS } from './shopify.constants';
import { ShopifyModuleOptions } from './interfaces/shopify-module-options';
import { PassportStatic } from 'passport';
import { Mongoose } from 'mongoose';


@Module({
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
    ShopifyAuthService,
    SyncService,
    OrdersService,
    ProductsService,
    ThemesService,
    AssetsService,
    LocalesService,
  ],
  controllers: [
    ShopifyAuthController,
    ChargeController,
    ShopController,
    ThemesController,
    AssetsController,
    LocalesController,
    OrdersController,
    ProductsController,
  ],
  exports: [
    ShopifyConnectService,
    ShopifyApiGuard,
    ShopifyAuthService,
    ChargeService,
  ],
})
export class ShopifyModule implements NestModule {
  static forRoot(options: ShopifyModuleOptions, database: Mongoose, passport: PassportStatic): DynamicModule {
    const shopifyModuleOptions = {
      provide: SHOPIFY_MODULE_OPTIONS,
      useValue: options
    };
    const mongooseDatabase = {
      provide: 'defaultDatabase',
      useValue: database,
    };

    const passportProvider = {
      provide: 'Passport',
      useValue: passport,
    };

    return {
      module: ShopifyModule,
      providers: [
        passportProvider,
        shopifyModuleOptions,
        mongooseDatabase,
        ...shopifyConnectProviders(database),
        ...shopifyApiProviders(database),
      ],
      exports: [
        mongooseDatabase,
        ...shopifyConnectProviders(database),
        ...shopifyApiProviders(database),
      ]
    }
  }
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetShopMiddleware)
      .with('ShopifyModule')
      .forRoutes(ThemesController)

      .apply(GetShopMiddleware)
      .with('ShopifyModule')
      .forRoutes(AssetsController)

      .apply(GetShopMiddleware)
      .with('ShopifyModule')
      .forRoutes(LocalesController);
  }
}

export { ShopifyAuthService };