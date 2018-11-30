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
const debug_service_1 = require("../debug.service");
const shopify_constants_1 = require("../shopify.constants");
let ShopifyAuthService = class ShopifyAuthService {
    constructor(shopifyModuleOptions) {
        this.shopifyModuleOptions = shopifyModuleOptions;
        this.logger = new debug_service_1.DebugService('shopify:AuthService');
    }
    isLoggedIn(request) {
        this.logger.debug('isLoggedIn');
        if (request.user !== null && typeof request.user === 'object') {
            return true;
        }
        return false;
    }
    getClientHost(request) {
        let host;
        if (request.headers.origin) {
            host = request.headers.origin.split('://')[1];
        }
        else {
            host = request.headers.host;
        }
        return host;
    }
    getShop(request) {
        let shop = null;
        const host = this.getClientHost(request);
        this.logger.debug('validateRequest', host);
        if (!host) {
            this.logger.debug(`no host!`);
            return null;
        }
        if (host.endsWith('.shopifypreview.com')) {
            if (request.query && request.query.shop) {
                shop = request.query.shop;
                this.logger.debug('preview shop', shop);
                return shop;
            }
        }
        if (host === this.shopifyModuleOptions.appHost) {
            if (!this.isLoggedIn(request)) {
                return null;
            }
            shop = request.user.shop.domain;
            return shop;
        }
        else {
            shop = host;
        }
        return shop;
    }
};
ShopifyAuthService = __decorate([
    common_1.Injectable(),
    __param(0, common_1.Inject(shopify_constants_1.SHOPIFY_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], ShopifyAuthService);
exports.ShopifyAuthService = ShopifyAuthService;
//# sourceMappingURL=auth.service.js.map