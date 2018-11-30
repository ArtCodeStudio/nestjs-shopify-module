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
const roles_decorator_1 = require("../../../guards/roles.decorator");
const debug_service_1 = require("../../../debug.service");
const assets_service_1 = require("./assets.service");
const shopify_api_guard_1 = require("../../../guards/shopify-api.guard");
const url = require("url");
let AssetsController = class AssetsController {
    constructor() {
        this.logger = new debug_service_1.DebugService(`shopify:${this.constructor.name}`);
    }
    async listThemeAssets(req, res, themeId) {
        const themeAssetService = new assets_service_1.ShopifyThemeAssetService(req.user.myshopify_domain, req.user.accessToken);
        return themeAssetService.list(themeId)
            .then((assets) => {
            this.logger.debug(`themes`, assets);
            return res.jsonp(assets);
        })
            .catch((error) => {
            this.logger.error(error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
                message: error.message,
            });
        });
    }
    async getThemeAsset(req, res, themeId, key) {
        const themeAssetService = new assets_service_1.ShopifyThemeAssetService(req.user.myshopify_domain, req.user.accessToken);
        const path = url.parse(req.url).pathname;
        key = path.substring(path.lastIndexOf(key));
        return themeAssetService.get(themeId, key)
            .then((asset) => {
            this.logger.debug(`asset`, asset);
            return res.jsonp(asset);
        })
            .catch((error) => {
            this.logger.error(error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
                message: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            });
        });
    }
};
__decorate([
    common_1.UseGuards(shopify_api_guard_1.ShopifyApiGuard),
    roles_decorator_1.Roles('shopify-staff-member'),
    common_1.Get(':theme_id/assets'),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.Param('theme_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "listThemeAssets", null);
__decorate([
    common_1.UseGuards(shopify_api_guard_1.ShopifyApiGuard),
    roles_decorator_1.Roles('shopify-staff-member'),
    common_1.Get(':theme_id/assets/:key*'),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.Param('theme_id')),
    __param(3, common_1.Param('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, String]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "getThemeAsset", null);
AssetsController = __decorate([
    common_1.Controller('shopify/api/themes')
], AssetsController);
exports.AssetsController = AssetsController;
//# sourceMappingURL=assets.controller.js.map