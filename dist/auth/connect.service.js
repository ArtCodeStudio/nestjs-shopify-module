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
let ShopifyConnectService = class ShopifyConnectService {
    constructor(shopifyConnectModel) {
        this.shopifyConnectModel = shopifyConnectModel;
        this.logger = new debug_service_1.DebugService('shopify:ShopifyConnectService');
    }
    async connectOrUpdate(userProfile, accessToken) {
        this.logger.debug('connectOrUpdate', userProfile.username);
        const now = new Date();
        const newShopifyConnect = new this.shopifyConnectModel({
            _id: mongoose_1.Types.ObjectId(userProfile.id),
            shopifyID: Number(userProfile.id),
            myshopify_domain: userProfile._json.shop.myshopify_domain,
            shop: userProfile._json.shop,
            accessToken,
            updatedAt: now,
            createdAt: now,
            roles: ['shopify-staff-member'],
        });
        return this.findByDomain(newShopifyConnect.myshopify_domain)
            .then((user) => {
            if (user) {
                this.logger.debug(`update`, newShopifyConnect);
                return this.shopifyConnectModel.updateOne({ shopifyID: newShopifyConnect.shopifyID }, {
                    myshopify_domain: newShopifyConnect.myshopify_domain,
                    accessToken: newShopifyConnect.accessToken,
                    updatedAt: newShopifyConnect.updatedAt,
                }).exec()
                    .then((updateResult) => {
                    this.logger.debug(`updateOne updateResult`, updateResult);
                    return this.findByShopifyId(newShopifyConnect.shopifyID);
                });
            }
            this.logger.debug(`create`);
            return this.shopifyConnectModel.create(newShopifyConnect);
        });
    }
    async findAll() {
        return await this.shopifyConnectModel.find().exec();
    }
    async findByDomain(domain) {
        let query = { 'shop.domain': domain };
        return this.shopifyConnectModel.findOne(query).exec()
            .then((shopifyConnect) => {
            if (shopifyConnect === null) {
                query = { 'shop.myshopify_domain': domain };
                return this.shopifyConnectModel.findOne(query).exec();
            }
            return shopifyConnect;
        });
    }
    async findByShopifyId(id) {
        return this.shopifyConnectModel.findOne({ shopifyID: id }).exec()
            .then((user) => {
            this.logger.debug(`findByShopifyId`, user);
            return user;
        });
    }
};
ShopifyConnectService = __decorate([
    common_1.Injectable(),
    __param(0, common_1.Inject('ShopifyConnectModelToken')),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_1.Model !== "undefined" && mongoose_1.Model) === "function" && _a || Object])
], ShopifyConnectService);
exports.ShopifyConnectService = ShopifyConnectService;
var _a;
//# sourceMappingURL=connect.service.js.map