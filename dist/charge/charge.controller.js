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
const charge_service_1 = require("./charge.service");
const debug_service_1 = require("../debug.service");
const roles_decorator_1 = require("../guards/roles.decorator");
const shopify_constants_1 = require("../shopify.constants");
let ChargeController = class ChargeController {
    constructor(shopifyModuleOptions) {
        this.shopifyModuleOptions = shopifyModuleOptions;
        this.debug = new debug_service_1.DebugService('ChargeController').debug;
    }
    activate(name, req, res, session) {
        this.debug('req.user', req.user);
        const user = req.user;
        const chargeService = new charge_service_1.ChargeService(user.myshopify_domain, user.accessToken, this.shopifyModuleOptions);
        return chargeService.createByName(name)
            .then((charge) => {
            this.debug('charge', charge);
            return res.redirect(charge.confirmation_url);
        })
            .catch((error) => {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error });
        });
    }
    callback(chargeId, req, res) {
        this.debug('callback', chargeId);
        return res.send('ok');
    }
};
__decorate([
    common_1.Get('/:name'),
    roles_decorator_1.Roles('shopify-staff-member'),
    __param(0, common_1.Param('name')), __param(1, common_1.Req()), __param(2, common_1.Res()), __param(3, common_1.Session()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ChargeController.prototype, "activate", null);
__decorate([
    common_1.Get('/callback'),
    roles_decorator_1.Roles('shopify-staff-member'),
    __param(0, common_1.Query('charge_id')), __param(1, common_1.Req()), __param(2, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ChargeController.prototype, "callback", null);
ChargeController = __decorate([
    common_1.Controller('shopify/charge'),
    __param(0, common_1.Inject(shopify_constants_1.SHOPIFY_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], ChargeController);
exports.ChargeController = ChargeController;
//# sourceMappingURL=charge.controller.js.map