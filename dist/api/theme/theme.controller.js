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
const roles_decorator_1 = require("../../guards/roles.decorator");
const debug_service_1 = require("debug.service");
const theme_service_1 = require("../../api/theme/theme.service");
const shopify_api_guard_1 = require("../../guards/shopify-api.guard");
let ThemeController = class ThemeController {
    constructor() {
        this.logger = new debug_service_1.DebugService(`shopify:${this.constructor.name}`);
    }
    getThemes(req, res) {
        const themeService = new theme_service_1.ShopifyThemeService(req.user.myshopify_domain, req.user.accessToken);
        return themeService.list()
            .then((themes) => {
            this.logger.debug(`themes`, themes);
            return res.jsonp(themes);
        })
            .catch((error) => {
            this.logger.error(error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
                message: error.message,
            });
        });
    }
    getTheme(themeId, req, res) {
        const themeService = new theme_service_1.ShopifyThemeService(req.user.myshopify_domain, req.user.accessToken);
        return themeService.get(themeId)
            .then((theme) => {
            this.logger.debug(`theme`, theme);
            return res.jsonp(theme);
        })
            .catch((error) => {
            this.logger.error(error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).jsonp({
                message: error.message,
            });
        });
    }
};
__decorate([
    common_1.UseGuards(shopify_api_guard_1.ShopifyApiGuard),
    roles_decorator_1.Roles('shopify-staff-member'),
    common_1.Get(),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ThemeController.prototype, "getThemes", null);
__decorate([
    common_1.UseGuards(shopify_api_guard_1.ShopifyApiGuard),
    roles_decorator_1.Roles('shopify-staff-member'),
    common_1.Get(':theme_id'),
    __param(0, common_1.Param('theme_id')),
    __param(1, common_1.Req()),
    __param(2, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ThemeController.prototype, "getTheme", null);
ThemeController = __decorate([
    common_1.Controller('shopify/api/themes'),
    __metadata("design:paramtypes", [])
], ThemeController);
exports.ThemeController = ThemeController;
//# sourceMappingURL=theme.controller.js.map