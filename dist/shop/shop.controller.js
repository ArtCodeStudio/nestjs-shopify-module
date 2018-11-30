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
const roles_decorator_1 = require("../guards/roles.decorator");
const shop_service_1 = require("./shop.service");
const debug_service_1 = require("../debug.service");
let ShopController = class ShopController {
    constructor(shopService) {
        this.shopService = shopService;
        this.logger = new debug_service_1.DebugService('shopify:ShopController');
    }
    connects(res, req) {
        return this.shopService.findAll()
            .then((connects) => {
            return res.json(connects);
        })
            .catch((error) => {
            this.logger.error(error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Failure on get shops`,
            });
        });
    }
    connect(id, res, req) {
        return this.shopService.findByShopifyID(Number(id))
            .then((connect) => {
            return res.json(connect);
        })
            .catch((error) => {
            this.logger.error(error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Failure on get shop with id ${id}.`,
                id,
            });
        });
    }
};
__decorate([
    common_1.Get(),
    roles_decorator_1.Roles('admin'),
    __param(0, common_1.Res()), __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ShopController.prototype, "connects", null);
__decorate([
    common_1.Get('/:id'),
    roles_decorator_1.Roles('admin'),
    __param(0, common_1.Param('id')), __param(1, common_1.Res()), __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ShopController.prototype, "connect", null);
ShopController = __decorate([
    common_1.Controller('shopify/shop'),
    __metadata("design:paramtypes", [shop_service_1.ShopService])
], ShopController);
exports.ShopController = ShopController;
//# sourceMappingURL=shop.controller.js.map