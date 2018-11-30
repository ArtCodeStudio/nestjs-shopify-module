"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = require("passport");
const passport_2 = require("@nestjs/passport");
const passport_shopify_1 = require("passport-shopify");
const debug_service_1 = require("../debug.service");
class ShopifyAuthStrategy extends passport_2.PassportStrategy(passport_shopify_1.Strategy, 'shopify') {
    constructor(shop, shopifyConnectService, shopifyModuleOptions) {
        super({
            clientID: shopifyModuleOptions.clientID,
            clientSecret: shopifyModuleOptions.clientSecret,
            callbackURL: shopifyModuleOptions.callbackURL,
            shop,
        });
        this.shopifyConnectService = shopifyConnectService;
        this.shopifyModuleOptions = shopifyModuleOptions;
        this.logger = new debug_service_1.DebugService('shopify:ShopifyAuthStrategy');
        passport_1.serializeUser(this.serializeUser.bind(this));
        passport_1.deserializeUser(this.deserializeUser.bind(this));
    }
    validate(accessToken, refreshToken, profile, done) {
        this.logger.debug(`accessToken`, accessToken);
        this.logger.debug(`refreshToken`, refreshToken);
        this.logger.debug(`profile`, profile);
        return this.shopifyConnectService.connectOrUpdate(profile, accessToken)
            .then((user) => {
            this.logger.debug(`user`, user);
            return done(null, user);
        })
            .catch((err) => {
            this.logger.error(err);
            return done(err);
        });
    }
    serializeUser(user, done) {
        this.logger.debug(`serializeUser user id`, user.shopifyID);
        return done(null, user.shopifyID);
    }
    deserializeUser(id, done) {
        this.logger.debug(`deserializeUser`, id);
        return this.shopifyConnectService.findByShopifyId(id)
            .then((user) => {
            return done(null, user);
        })
            .catch((error) => {
            this.logger.error(error);
            return done(error);
        });
    }
    authenticate(req, options) {
        return super.authenticate(req, options);
    }
}
exports.ShopifyAuthStrategy = ShopifyAuthStrategy;
//# sourceMappingURL=auth.strategy.js.map