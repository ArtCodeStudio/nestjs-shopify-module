import { Module, DynamicModule, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportStatic } from 'passport';
import { Mongoose } from 'mongoose';

// Auth
import { ShopifyAuthController } from './auth/auth.controller';
import { shopifyConnectProviders } from './auth/connect.providers';
import { ShopifyConnectService } from './auth/connect.service';
import { ShopifyAuthService } from './auth/auth.service';
import { PassportService } from './auth/passport.service';

// API
import { BlogsController } from './api/blogs/blogs.controller';
import { BlogsService } from './api/blogs/blogs.service';
import { ThemesService } from './api/themes/themes.service';
import { ThemesController } from './api/themes/themes.controller';
import { AssetsService } from './api/themes/assets/assets.service';
import { LocalesService } from './api/themes/locales/locales.service';
import { AssetsController } from './api/themes/assets/assets.controller';
import { LocalesController } from './api/themes/locales/locales.controller';
import { OrdersService } from './api/orders/orders.service';
import { ProductVariantsService } from './api/products/product-variants/product-variants.service';
import { ProductsService } from './api/products/products.service';
import { OrdersController } from './api/orders/orders.controller';
import { ProductsController } from './api/products/products.controller';
import { TransactionsController } from './api/orders/transactions/transactions.controller';
import { TransactionsService } from './api/orders/transactions/transactions.service';
import { WebhooksGateway } from './api/webhooks/webhooks.gateway';
import { ProductsGateway } from './api/products/products.gateway';
import { PagesController } from './api/pages/pages.controller';
import { PagesService } from './api/pages/pages.service';
import { CheckoutsService } from './api/checkouts/checkouts.service';
import { ArticlesController } from './api/blogs/articles/articles.controller';
import { ArticlesService } from './api/blogs/articles/articles.service';
import { SmartCollectionsService } from './api/smart-collections/smart-collections.service';
import { CustomCollectionsService } from './api/custom-collections/custom-collections.service';
import { SmartCollectionsController } from './api/smart-collections/smart-collections.controller';
import { CustomCollectionsController } from './api/custom-collections/custom-collections.controller';
import { CollectsService } from './api/collects/collects.service';
import { CollectsController } from './api/collects/collects.controller';
import { SearchController } from './api/search/search.controller';
import { SearchService } from './api/search/search.service';
import { shopifyApiProviders } from './api/api.providers';

// API Extended
import { ExtProductsService, ExtProductsController } from './api-ext';

// Charge
import { ChargeController } from './charge/charge.controller';
import { ChargeService } from './charge/charge.service';

// Shop
import { ShopController } from './shop/shop.controller';
import { ShopService } from './shop/shop.service';

// Sync
import { SyncService } from './sync/sync.service';
import { SyncGateway } from './sync/sync.gateway';
import { syncProviders } from './sync/sync-providers';
import { SyncController } from './sync/sync.controller';

// Webhooks
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksService } from './webhooks/webhooks.service';

// Other
import { SHOPIFY_MODULE_OPTIONS } from './shopify.constants';
import { ShopifyModuleOptions } from './interfaces/shopify-module-options';
import { EventService } from './event.service';
import { RolesGuard } from './guards/roles.guard';
import { ShopifyApiGuard } from './guards/shopify-api.guard';

import {
  BodyParserJsonMiddleware,
  BodyParserUrlencodedMiddleware,
  GetShopifyConnectMiddleware,
  GetUserMiddleware,
  VerifyWebhookMiddleware,
} from './middlewares';

// Direct exports
export * from './graphql-client';

// Indirect exports
export {
  BlogsService,
  CheckoutsService,
  BodyParserJsonMiddleware,
  BodyParserUrlencodedMiddleware,
  ShopifyConnectService,
  ShopService,
  ShopifyApiGuard,
  ShopifyAuthService,
  ChargeService,
  EventService,
  WebhooksService,
  ProductsGateway,
  SyncGateway,
  WebhooksGateway,
  SyncService,
  OrdersService,
  TransactionsService,
  ProductVariantsService,
  ProductsService,
  PagesService,
  ArticlesService,
  ThemesService,
  AssetsService,
  LocalesService,
  SmartCollectionsService,
  CustomCollectionsService,
  ExtProductsService,
};

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
    BlogsService,
    CheckoutsService,
    ChargeService,
    ShopifyConnectService,
    ShopService,
    ShopifyAuthService,
    PassportService,
    SyncService,
    OrdersService,
    PagesService,
    ArticlesService,
    ProductVariantsService,
    ProductsService,
    ThemesService,
    AssetsService,
    LocalesService,
    TransactionsService,
    EventService,
    WebhooksService,
    ProductsGateway,
    SyncGateway,
    WebhooksGateway,
    SmartCollectionsService,
    CustomCollectionsService,
    SearchService,
    CollectsService,
    ExtProductsService,
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
    BlogsController,
    ArticlesController,
    ProductsController,
    TransactionsController,
    WebhooksController,
    SyncController,
    SmartCollectionsController,
    CustomCollectionsController,
    SearchController,
    CollectsController,
    ExtProductsController,
  ],
  exports: [
    BlogsService,
    CheckoutsService,
    ShopifyConnectService,
    ShopService,
    ShopifyApiGuard,
    ShopifyAuthService,
    ChargeService,
    EventService,
    WebhooksService,
    ProductsGateway,
    SyncGateway,
    WebhooksGateway,
    SyncService,
    OrdersService,
    TransactionsService,
    ProductVariantsService,
    ProductsService,
    PagesService,
    ArticlesService,
    ThemesService,
    AssetsService,
    LocalesService,
    SmartCollectionsService,
    CustomCollectionsService,
  ],
  imports: [],
})
export class ShopifyModule implements NestModule {
  static forRoot(options: ShopifyModuleOptions, database: Mongoose, passport: PassportStatic): DynamicModule {

    const shopifyModuleOptions = {
      provide: SHOPIFY_MODULE_OPTIONS,
      useValue: options,
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
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer

      .apply(BodyParserJsonMiddleware)
      .forRoutes(PagesController)
      .apply(BodyParserUrlencodedMiddleware)
      .forRoutes(PagesController)

      .apply(BodyParserJsonMiddleware)
      .forRoutes(BlogsController)
      .apply(BodyParserUrlencodedMiddleware)
      .forRoutes(BlogsController)

      .apply(BodyParserJsonMiddleware)
      .forRoutes(ArticlesController)
      .apply(BodyParserUrlencodedMiddleware)
      .forRoutes(ArticlesController)

      .apply(BodyParserJsonMiddleware)
      .forRoutes(ProductsController)
      .apply(BodyParserUrlencodedMiddleware)
      .forRoutes(ProductsController)

      .apply(BodyParserJsonMiddleware)
      .forRoutes(SyncController)
      .apply(BodyParserUrlencodedMiddleware)
      .forRoutes(SyncController)

      .apply(BodyParserJsonMiddleware)
      .forRoutes(ExtProductsController)
      .apply(BodyParserUrlencodedMiddleware)
      .forRoutes(ExtProductsController)

      .apply(GetUserMiddleware)
      .forRoutes({
        path: '*', method: RequestMethod.ALL,
      })

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(ShopifyAuthController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(LocalesController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(OrdersController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(PagesController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(BlogsController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(ArticlesController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(SmartCollectionsController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(CustomCollectionsController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(ProductsController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(ExtProductsController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(ThemesController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(AssetsController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(TransactionsController)

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(WebhooksController)

      .apply(VerifyWebhookMiddleware)
      .forRoutes('webhooks/:resource/:event')

      .apply(GetShopifyConnectMiddleware)
      .forRoutes(SyncController);
  }
}