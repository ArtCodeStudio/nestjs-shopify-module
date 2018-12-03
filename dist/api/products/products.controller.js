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
const products_service_1 = require("./products.service");
const debug_service_1 = require("../../debug.service");
const shopify_api_guard_1 = require("../../guards/shopify-api.guard");
const roles_decorator_1 = require("../../guards/roles.decorator");
let ProductsController = class ProductsController {
    constructor() {
        this.logger = new debug_service_1.DebugService(`shopify:${this.constructor.name}`);
    }
    list(req, res) {
        const productsService = new products_service_1.ProductsService(req.user.myshopify_domain, req.user.accessToken);
        return productsService.list()
            .then((orders) => {
            this.logger.debug(`themes`, orders);
            return res.jsonp(orders);
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
    __param(0, common_1.Req()), __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "list", null);
ProductsController = __decorate([
    common_1.Controller('shopify/api/products')
], ProductsController);
exports.ProductsController = ProductsController;
//# sourceMappingURL=products.controller.js.map