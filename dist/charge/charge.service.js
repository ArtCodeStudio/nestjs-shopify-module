"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shopify_prime_1 = require("shopify-prime");
class ChargeService extends shopify_prime_1.RecurringCharges {
    constructor(shopDomain, shopAccessToken, shopifyModuleOptions) {
        super(shopDomain, shopAccessToken);
        this.shopifyModuleOptions = shopifyModuleOptions;
        this.return_url = `http://localhost:3000/shopify/charge/callback`;
    }
    getPlanByName(name) {
        const plans = this.shopifyModuleOptions.plans;
        for (const plan of plans) {
            if (plan.name === name) {
                return plan;
            }
        }
        return null;
    }
    async createByName(planName) {
        let plan;
        if (!planName) {
            plan = this.getPlanByName('Default');
        }
        else {
            plan = this.getPlanByName(planName);
        }
        if (plan === null) {
            throw new Error('Charge not found');
        }
        return super.create(plan);
    }
    async activate(id) {
        if (id) {
            return super.activate(id);
        }
        this.list()
            .then((list) => {
            return super.activate(list[0].id);
        });
    }
}
exports.ChargeService = ChargeService;
//# sourceMappingURL=charge.service.js.map