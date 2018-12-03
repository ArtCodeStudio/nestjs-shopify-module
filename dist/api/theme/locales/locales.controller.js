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
const debug_service_1 = require("../../../debug.service");
const shopify_locales_service_1 = require("../../../api/theme/locales/shopify-locales.service");
const shopify_api_guard_1 = require("../../../guards/shopify-api.guard");
const connect_service_1 = require("../../../auth/connect.service");
const shopify_constants_1 = require("../../../shopify.constants");
const url = require("url");
const cacheManager = require("cache-manager");
let LocalesController = class LocalesController {
    constructor(shopifyConnectService, shopifyModuleOptions) {
        this.shopifyConnectService = shopifyConnectService;
        this.shopifyModuleOptions = shopifyModuleOptions;
        this.logger = new debug_service_1.DebugService(`shopify:${this.constructor.name}`);
        this.redisCache = cacheManager.caching(this.shopifyModuleOptions.cache);
    }
    async getFullLocale(req, res, themeId) {
        const shopifyConnect = req.shopifyConnect;
        const key = JSON.stringify({ name: `shopify/api/themes/${themeId}`, myshopify_domain: shopifyConnect.shop.myshopify_domain });
        return this.redisCache.wrap(key, () => {
            const localesService = new shopify_locales_service_1.ShopifyLocalesService(shopifyConnect.shop.myshopify_domain, shopifyConnect.accessToken);
            return localesService.get(themeId);
        })
            .then((locale) => {
            this.logger.debug(`assets`, locale);
            return res.jsonp(locale);
        })
            .catch((error) => {
            this.logger.debug(error);
            if (error.statusCode === 404) {
                error.message = `Locales in theme ${themeId} not found.`;
            }
            if (!error.statusCode) {
                error.statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            }
            const errorRes = {
                name: error.name,
                message: error.message,
                statusCode: error.statusCode,
                id: themeId,
                stack: undefined,
            };
            if (this.shopifyModuleOptions.debug && error.stack) {
                errorRes.stack = error.stack;
            }
            return res.status(error.statusCode).jsonp(errorRes);
        });
    }
    async listLocales(req, res, themeId) {
        const shopifyConnect = req.shopifyConnect;
        const localesService = new shopify_locales_service_1.ShopifyLocalesService(shopifyConnect.shop.myshopify_domain, shopifyConnect.accessToken);
        return localesService.list(themeId)
            .then((assets) => {
            return res.jsonp(assets);
        })
            .catch((error) => {
            this.logger.error(error);
            const errorRes = {
                name: error.name,
                message: error.message,
                statusCode: error.statusCode,
                id: themeId,
                stack: undefined,
            };
            if (this.shopifyModuleOptions.debug && error.stack) {
                errorRes.stack = error.stack;
            }
            return res.status(error.statusCode).jsonp(errorRes);
        });
    }
    async getLocale(req, res, themeId, filename) {
        const shopifyConnect = req.shopifyConnect;
        const localesService = new shopify_locales_service_1.ShopifyLocalesService(shopifyConnect.shop.myshopify_domain, shopifyConnect.accessToken);
        const path = url.parse(req.url).pathname;
        filename = path.substring(path.lastIndexOf('/'));
        return localesService.getLocalFile(themeId, filename)
            .then((locale) => {
            this.logger.debug(`assets`, locale);
            return res.jsonp(locale);
        })
            .catch((error) => {
            this.logger.error(error);
            if (error.statusCode === 404) {
                error.message = `Local file ${filename} in theme ${themeId} not found.`;
            }
            const errorRes = {
                name: error.name,
                message: error.message,
                statusCode: error.statusCode,
                id: themeId,
                stack: undefined,
            };
            if (this.shopifyModuleOptions.debug && error.stack) {
                errorRes.stack = error.stack;
            }
            return res.status(error.statusCode).jsonp(errorRes);
        });
    }
    async getSectionLocale(req, res, themeId, filename) {
        const shopifyConnect = req.shopifyConnect;
        const localesService = new shopify_locales_service_1.ShopifyLocalesService(shopifyConnect.shop.myshopify_domain, shopifyConnect.accessToken);
        const path = url.parse(req.url).pathname;
        filename = path.substring(path.lastIndexOf('/'));
        return localesService.getSectionFile(themeId, filename)
            .then((locale) => {
            this.logger.debug(`assets`, locale);
            return res.jsonp(locale);
        })
            .catch((error) => {
            this.logger.error(error);
            if (error.statusCode === 404) {
                error.message = `Section file ${filename} in theme ${themeId} not found.`;
            }
            const errorRes = {
                name: error.name,
                message: error.message,
                statusCode: error.statusCode,
                id: themeId,
                filename,
                stack: undefined,
            };
            if (this.shopifyModuleOptions.debug && error.stack) {
                errorRes.stack = error.stack;
            }
            return res.status(error.statusCode).jsonp(errorRes);
        });
    }
    async getFullLocaleByProperty(req, res, themeId, propertyPath) {
        const path = url.parse(req.url).pathname;
        const shopifyConnect = req.shopifyConnect;
        const key = JSON.stringify({ name: path, myshopify_domain: shopifyConnect.myshopify_domain });
        return this.redisCache.wrap(key, () => {
            const findStr = `${themeId}/locales/`;
            propertyPath = path.substring(path.lastIndexOf(findStr) + findStr.length);
            const properties = propertyPath.split('/');
            const localesService = new shopify_locales_service_1.ShopifyLocalesService(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
            return localesService.get(themeId, properties);
        })
            .then((locale) => {
            this.logger.debug(`assets`, locale);
            if (locale) {
                return res.jsonp(locale);
            }
            const error = new Error(`Locales with path ${propertyPath} in theme ${themeId} not found.`);
            error.name = 'Not found';
            error.statusCode = 404;
            throw error;
        })
            .catch((error) => {
            this.logger.error(error);
            if (error.statusCode === 404) {
                error.message = `Locales with path ${propertyPath} in theme ${themeId} not found.`;
            }
            const errorRes = {
                name: error.name,
                message: error.message,
                statusCode: error.statusCode,
                id: themeId,
                path,
                stack: undefined,
            };
            if (this.shopifyModuleOptions.debug && error.stack) {
                errorRes.stack = error.stack;
            }
            return res.status(error.statusCode).jsonp(errorRes);
        });
    }
};
__decorate([
    common_1.UseGuards(shopify_api_guard_1.ShopifyApiGuard),
    common_1.Get(':theme_id/locales'),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.Param('theme_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number]),
    __metadata("design:returntype", Promise)
], LocalesController.prototype, "getFullLocale", null);
__decorate([
    common_1.UseGuards(shopify_api_guard_1.ShopifyApiGuard),
    common_1.Get(':theme_id/locales/list'),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.Param('theme_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number]),
    __metadata("design:returntype", Promise)
], LocalesController.prototype, "listLocales", null);
__decorate([
    common_1.UseGuards(shopify_api_guard_1.ShopifyApiGuard),
    common_1.Get(':theme_id/locales/*.json'),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.Param('theme_id')),
    __param(3, common_1.Param('*.json')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, String]),
    __metadata("design:returntype", Promise)
], LocalesController.prototype, "getLocale", null);
__decorate([
    common_1.UseGuards(shopify_api_guard_1.ShopifyApiGuard),
    common_1.Get(':theme_id/locales/*.liquid'),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.Param('theme_id')),
    __param(3, common_1.Param('filename')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, String]),
    __metadata("design:returntype", Promise)
], LocalesController.prototype, "getSectionLocale", null);
__decorate([
    common_1.UseGuards(shopify_api_guard_1.ShopifyApiGuard),
    common_1.Get(':theme_id/locales/:property_path*'),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.Param('theme_id')),
    __param(3, common_1.Param('property_path*')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, String]),
    __metadata("design:returntype", Promise)
], LocalesController.prototype, "getFullLocaleByProperty", null);
LocalesController = __decorate([
    common_1.Controller('shopify/api/themes'),
    __param(1, common_1.Inject(shopify_constants_1.SHOPIFY_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [connect_service_1.ShopifyConnectService, Object])
], LocalesController);
exports.LocalesController = LocalesController;
//# sourceMappingURL=locales.controller.js.map