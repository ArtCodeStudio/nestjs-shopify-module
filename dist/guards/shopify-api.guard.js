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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const connect_service_1 = require("../auth/connect.service");
const auth_service_1 = require("../auth/auth.service");
const debug_service_1 = require("../debug.service");
let ShopifyApiGuard = class ShopifyApiGuard {
    constructor(shopifyConnectService, shopifyAuthService) {
        this.shopifyConnectService = shopifyConnectService;
        this.shopifyAuthService = shopifyAuthService;
        this.logger = new debug_service_1.DebugService('shopify:ShopifyApiGuard');
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        return this.validateRequest(request);
    }
    validateRequest(request) {
        const shop = this.shopifyAuthService.getShop(request);
        this.logger.debug(`validateRequest shop`, shop);
        if (shop === null) {
            return false;
        }
        return this.shopifyConnectService.findByDomain(shop)
            .then((shopifyConnect) => {
            this.logger.debug(`shopifyConnectService.findByDomain result`, shopifyConnect);
            if (shopifyConnect && shopifyConnect.shop) {
                if (shop === shopifyConnect.shop.domain || shop === shopifyConnect.shop.myshopify_domain) {
                    return true;
                }
            }
            return false;
        })
            .catch((error) => {
            this.logger.error(error);
            return false;
        });
    }
};
ShopifyApiGuard = __decorate([
    common_1.Injectable(),
    __param(0, common_1.Inject(connect_service_1.ShopifyConnectService)),
    __param(1, common_1.Inject(auth_service_1.ShopifyAuthService)),
    __metadata("design:paramtypes", [connect_service_1.ShopifyConnectService,
        auth_service_1.ShopifyAuthService])
], ShopifyApiGuard);
exports.ShopifyApiGuard = ShopifyApiGuard;
//# sourceMappingURL=shopify-api.guard.js.map