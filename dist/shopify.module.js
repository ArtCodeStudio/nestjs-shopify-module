"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_controller_1 = require("./auth/auth.controller");
const connect_providers_1 = require("./auth/connect.providers");
const connect_service_1 = require("./auth/connect.service");
const charge_controller_1 = require("./charge/charge.controller");
const charge_service_1 = require("./charge/charge.service");
const shop_controller_1 = require("./shop/shop.controller");
const shop_service_1 = require("./shop/shop.service");
const roles_guard_1 = require("./guards/roles.guard");
const shopify_api_guard_1 = require("./guards/shopify-api.guard");
const api_controller_1 = require("./api/api.controller");
const theme_controller_1 = require("./api/theme/theme.controller");
const auth_service_1 = require("./auth/auth.service");
const assets_controller_1 = require("./api/theme/assets/assets.controller");
const locales_controller_1 = require("./api/theme/locales/locales.controller");
const get_shop_middleware_1 = require("./middlewares/get-shop.middleware");
const sync_service_1 = require("./sync/sync.service");
const orders_service_1 = require("./api/orders/orders.service");
const products_service_1 = require("./api/products/products.service");
const orders_controller_1 = require("./api/orders/orders.controller");
const products_controller_1 = require("./api/products/products.controller");
const shopify_constants_1 = require("./shopify.constants");
let ShopifyModule = ShopifyModule_1 = class ShopifyModule {
    static forRoot(options, database) {
        const shopifyModuleOptions = {
            provide: shopify_constants_1.SHOPIFY_MODULE_OPTIONS,
            useValue: options
        };
        const mongooseDatabase = {
            provide: 'defaultDatabase',
            useValue: database,
        };
        return {
            module: ShopifyModule_1,
            providers: [
                shopifyModuleOptions,
                mongooseDatabase,
            ]
        };
    }
    configure(consumer) {
        consumer
            .apply(get_shop_middleware_1.GetShopMiddleware)
            .with('ShopifyModule')
            .forRoutes(api_controller_1.ApiController)
            .apply(get_shop_middleware_1.GetShopMiddleware)
            .with('ShopifyModule')
            .forRoutes(theme_controller_1.ThemeController)
            .apply(get_shop_middleware_1.GetShopMiddleware)
            .with('ShopifyModule')
            .forRoutes(assets_controller_1.AssetsController)
            .apply(get_shop_middleware_1.GetShopMiddleware)
            .with('ShopifyModule')
            .forRoutes(locales_controller_1.LocalesController);
    }
};
ShopifyModule = ShopifyModule_1 = __decorate([
    common_1.Module({
        providers: [
            shopify_api_guard_1.ShopifyApiGuard,
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            charge_service_1.ChargeService,
            connect_service_1.ShopifyConnectService,
            shop_service_1.ShopService,
            ...connect_providers_1.shopifyConnectProviders,
            auth_service_1.ShopifyAuthService,
            sync_service_1.SyncService,
            orders_service_1.OrdersService,
            products_service_1.ProductsService,
        ],
        controllers: [auth_controller_1.ShopifyAuthController, charge_controller_1.ChargeController, shop_controller_1.ShopController, api_controller_1.ApiController, theme_controller_1.ThemeController, assets_controller_1.AssetsController, locales_controller_1.LocalesController, orders_controller_1.OrdersController, products_controller_1.ProductsController],
        exports: [connect_service_1.ShopifyConnectService, shopify_api_guard_1.ShopifyApiGuard, auth_service_1.ShopifyAuthService],
    })
], ShopifyModule);
exports.ShopifyModule = ShopifyModule;
var ShopifyModule_1;
//# sourceMappingURL=shopify.module.js.map