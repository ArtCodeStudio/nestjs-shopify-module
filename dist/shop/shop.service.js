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
const mongoose_1 = require("mongoose");
const debug_service_1 = require("../debug.service");
let ShopService = class ShopService {
    constructor(shopifyConnectModel) {
        this.shopifyConnectModel = shopifyConnectModel;
        this.logger = new debug_service_1.DebugService('shopify:ShopifyConnectService');
    }
    async findAll() {
        return this.shopifyConnectModel.find().exec()
            .then((connects) => {
            const shops = [];
            connects.forEach(connect => {
                shops.push(connect.shop);
            });
            return shops;
        });
    }
    async findByShopifyID(id, fields) {
        return this.shopifyConnectModel.findOne({ shopifyID: id }).exec()
            .then((connect) => {
            let shop;
            if (fields) {
                shop = {};
                fields.forEach((property, index) => {
                    if (shop.hasOwnProperty(property)) {
                        shop[property] = connect.shop[property];
                    }
                });
            }
            else {
                shop = connect.shop;
            }
            return shop;
        });
    }
};
ShopService = __decorate([
    common_1.Injectable(),
    __param(0, common_1.Inject('ShopifyConnectModelToken')),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_1.Model !== "undefined" && mongoose_1.Model) === "function" && _a || Object])
], ShopService);
exports.ShopService = ShopService;
var _a;
//# sourceMappingURL=shop.service.js.map