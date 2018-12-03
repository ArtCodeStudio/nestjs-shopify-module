"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const connect_service_1 = require("../auth/connect.service");
const debug_service_1 = require("../debug.service");
let GetShopMiddleware = class GetShopMiddleware {
    constructor(shopifyAuthService, shopifyConnectService) {
        this.shopifyAuthService = shopifyAuthService;
        this.shopifyConnectService = shopifyConnectService;
        this.logger = new debug_service_1.DebugService(`shopify:${this.constructor.name}`);
    }
    async resolve(...args) {
        return async (req, res, next) => {
            const shopDomain = this.shopifyAuthService.getShop(req);
            this.logger.debug('shopDomain', shopDomain);
            return this.shopifyConnectService.findByDomain(shopDomain)
                .then((shopifyConnect) => {
                this.logger.debug('shopifyConnect', shopifyConnect);
                req.shopifyConnect = shopifyConnect;
                return next();
            });
        };
    }
};
GetShopMiddleware = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [auth_service_1.ShopifyAuthService,
        connect_service_1.ShopifyConnectService])
], GetShopMiddleware);
exports.GetShopMiddleware = GetShopMiddleware;
//# sourceMappingURL=get-shop.middleware.js.map