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
const passport = require("passport");
const auth_strategy_1 = require("./auth.strategy");
const connect_service_1 = require("./connect.service");
const debug_service_1 = require("../debug.service");
const shopify_constants_1 = require("../shopify.constants");
const roles_decorator_1 = require("../guards/roles.decorator");
let ShopifyAuthController = class ShopifyAuthController {
    constructor(shopifyConnectService, shopifyModuleOptions) {
        this.shopifyConnectService = shopifyConnectService;
        this.shopifyModuleOptions = shopifyModuleOptions;
        this.logger = new debug_service_1.DebugService('shopify:AuthController');
    }
    oAuthConnect(shop, req, res, next, session) {
        if (typeof shop !== 'string') {
            return res.send('shop was not a string, e.g. /auth/shopify?shop=your-shop-name');
        }
        session.shop = shop;
        this.logger.debug('auth called', `AuthController:${shop}`);
        passport.use(`shopify-${shop}`, new auth_strategy_1.ShopifyAuthStrategy(shop, this.shopifyConnectService, this.shopifyModuleOptions));
        return passport.authenticate(`shopify-${shop}`, {
            scope: this.shopifyModuleOptions.scope,
            shop: req.query.shop,
        })(req, res, next);
    }
    callback(shop, req, res, next) {
        if (typeof shop !== 'string') {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'shop query param not found',
            });
        }
        this.logger.debug('callback called', `AuthController:${shop}`);
        return passport.authenticate(`shopify-${shop}`, {
            failureRedirect: `failure/${shop}`,
            successRedirect: `success/${shop}`,
            session: true,
            userProperty: 'user',
        })(req, res, next);
    }
    success(shop, res, req) {
        passport.unuse(`shopify-${shop}`);
        return res.json({
            message: 'successfully logged in',
            shop: req.user.shop,
        });
    }
    failure(shop, res, req) {
        passport.unuse(`shopify-${shop}`);
        return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: `Failure on oauth autentification`, shop });
    }
    connects(res, req) {
        return this.shopifyConnectService.findAll()
            .then((connects) => {
            return res.json(connects);
        })
            .catch((error) => {
            this.logger.error(error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: `Failure on get connected shopify accounts` });
        });
    }
    connect(id, res, req) {
        return this.shopifyConnectService.findByShopifyId(Number(id))
            .then((connect) => {
            return res.json(connect);
        })
            .catch((error) => {
            this.logger.error(error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({
                message: `Failure on get connected shopify account with id ${id}.`,
                info: error.message,
                name: error.name,
                id,
            });
        });
    }
};
__decorate([
    common_1.Get(),
    __param(0, common_1.Query('shop')), __param(1, common_1.Req()), __param(2, common_1.Res()), __param(3, common_1.Next()), __param(4, common_1.Session()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ShopifyAuthController.prototype, "oAuthConnect", null);
__decorate([
    common_1.Get('/callback'),
    __param(0, common_1.Query('shop')), __param(1, common_1.Req()), __param(2, common_1.Res()), __param(3, common_1.Next()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ShopifyAuthController.prototype, "callback", null);
__decorate([
    common_1.Get('/success/:shop'),
    __param(0, common_1.Param('shop')), __param(1, common_1.Res()), __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ShopifyAuthController.prototype, "success", null);
__decorate([
    common_1.Get('/failure/:shop'),
    __param(0, common_1.Param('shop')), __param(1, common_1.Res()), __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ShopifyAuthController.prototype, "failure", null);
__decorate([
    common_1.Get('/connected'),
    roles_decorator_1.Roles('admin'),
    __param(0, common_1.Res()), __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ShopifyAuthController.prototype, "connects", null);
__decorate([
    common_1.Get('/connected/:id'),
    roles_decorator_1.Roles('admin'),
    __param(0, common_1.Param('id')), __param(1, common_1.Res()), __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ShopifyAuthController.prototype, "connect", null);
ShopifyAuthController = __decorate([
    common_1.Controller('shopify/auth'),
    __param(1, common_1.Inject(shopify_constants_1.SHOPIFY_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [connect_service_1.ShopifyConnectService, Object])
], ShopifyAuthController);
exports.ShopifyAuthController = ShopifyAuthController;
//# sourceMappingURL=auth.controller.js.map