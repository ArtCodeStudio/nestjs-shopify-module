"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
exports.ShopifyShopSchema = new mongoose.Schema({
    id: Number,
    address1: String,
    address2: String,
    city: String,
    country: String,
    country_code: String,
    country_name: String,
    created_at: String,
    customer_email: String,
    currency: String,
    description: String,
    domain: String,
    email: String,
    force_ssl: Boolean,
    google_apps_domain: String,
    google_apps_login_enabled: Boolean,
    latitude: String,
    longitude: String,
    money_format: String,
    money_with_currency_format: String,
    myshopify_domain: String,
    name: String,
    plan_name: String,
    display_plan_name: String,
    password_enabled: Boolean,
    phone: String,
    primary_locale: String,
    province: String,
    province_code: String,
    ships_to_countries: String,
    shop_owner: String,
    source: String,
    tax_shipping: Boolean,
    taxes_included: Boolean,
    county_taxes: Boolean,
    timezone: String,
    iana_timezone: String,
    zip: String,
    has_storefront: Boolean,
    setup_required: Boolean,
    has_discounts: Boolean,
    has_gift_cards: Boolean,
});
//# sourceMappingURL=shop.schema.js.map