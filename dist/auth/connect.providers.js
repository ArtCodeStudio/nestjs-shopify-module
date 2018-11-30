"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connect_schema_1 = require("./connect.schema");
const shopifyConnectProviders = [
    {
        provide: 'ShopifyConnectModelToken',
        useFactory: (connection) => connection.model('shopify_connect', connect_schema_1.ShopifyConnectSchema),
        inject: ['defaultDatabase'],
    },
];
exports.shopifyConnectProviders = shopifyConnectProviders;
//# sourceMappingURL=connect.providers.js.map