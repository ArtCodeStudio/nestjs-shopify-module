/**
 * Middlewares
 */
import {
  BodyParserJsonMiddleware,
  BodyParserUrlencodedMiddleware,
  GetShopifyConnectMiddleware,
  GetUserMiddleware,
  VerifyWebhookMiddleware
} from './middlewares';

import { Module, DynamicModule, CacheModule, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
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
import { SyncService } from './sync/sync.service';
import { OrdersService } from './api/orders/orders.service';
import { ProductsService } from './api/products/products.service';
import { OrdersController } from './api/orders/orders.controller';
import { ProductsController } from './api/products/products.controller';
import { SHOPIFY_MODULE_OPTIONS } from './shopify.constants';
import { ShopifyModuleOptions } from './interfaces/shopify-module-options';
import { PassportStatic } from 'passport';
import { Mongoose } from 'mongoose';
import { TransactionsController } from './api/orders/transactions/transactions.controller';
import { TransactionsService } from './api/orders/transactions/transactions.service';
import { EventService } from './event.service';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksService } from './webhooks/webhooks.service';
import { WebhooksGateway } from './api/webhooks/webhooks.gateway';
import { ProductsGateway } from './api/products/products.gateway';
import { syncProviders } from './sync/sync-providers';
import { PagesController } from './api/pages/pages.controller';
import { PagesService } from './api/pages/pages.service';
import { ApiService } from './api/api.service';
import { SyncController } from './sync/sync.controller';
export { RequestGuard } from './guards/request.guard';

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
    PagesService,
    ProductsService,
    ThemesService,
    AssetsService,
    LocalesService,
    TransactionsService,
    EventService,
    WebhooksService,
    WebhooksGateway, // FIXME only one gateway the time is working?
    ProductsGateway,
    ApiService,
  ],
  controllers: [
    ShopifyAuthController,
    ChargeController,
    ShopController,
    ThemesController,
    AssetsController,
    LocalesController,
    OrdersController,
    PagesController,
    ProductsController,
    TransactionsController,
    WebhooksController,
    SyncController,
  ],
  exports: [
    ShopifyConnectService,
    ShopifyApiGuard,
    ShopifyAuthService,
    ChargeService,
    EventService,
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
        BodyParserJsonMiddleware,
        BodyParserUrlencodedMiddleware,
        GetShopifyConnectMiddleware,
        GetUserMiddleware,
        ...shopifyConnectProviders(database),
        ...shopifyApiProviders(database),
        ...syncProviders(database),
      ],
      exports: [
        mongooseDatabase,
        BodyParserJsonMiddleware,
        BodyParserUrlencodedMiddleware,
        GetShopifyConnectMiddleware,
        GetUserMiddleware,
        ...shopifyConnectProviders(database),
        ...shopifyApiProviders(database),
        ...syncProviders(database),
      ]
    }
  }
  configure(consumer: MiddlewareConsumer) {
    consumer

      .apply(BodyParserJsonMiddleware)
      .forRoutes(PagesController)

      .apply(BodyParserUrlencodedMiddleware)
      .forRoutes(PagesController)

      .apply(BodyParserJsonMiddleware)
      .forRoutes(ProductsController)

      .apply(BodyParserUrlencodedMiddleware)
      .forRoutes(ProductsController)

      .apply(GetUserMiddleware)
      .forRoutes({
        path: '*', method: RequestMethod.ALL
      })

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(ShopifyAuthController)

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(LocalesController)

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(OrdersController)

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(PagesController)

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(ProductsController)

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(ThemesController)

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(AssetsController)

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(TransactionsController)

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(WebhooksController)

      .apply(VerifyWebhookMiddleware)
      .with('ShopifyModule')
      .forRoutes('webhooks/:resource/:event')

      .apply(GetShopifyConnectMiddleware)
      .with('ShopifyModule')
      .forRoutes(SyncController);
  }
}

export { ShopifyAuthService };