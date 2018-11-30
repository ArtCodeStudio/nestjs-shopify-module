"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const shop_schema_1 = require("../shop/shop.schema");
exports.ShopifyConnectSchema = new mongoose.Schema({
    shopifyID: Number,
    myshopify_domain: String,
    accessToken: String,
    createdAt: Date,
    updatedAt: Date,
    roles: [String],
    shop: shop_schema_1.ShopifyShopSchema,
});
//# sourceMappingURL=connect.schema.js.map