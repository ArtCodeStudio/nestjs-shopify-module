"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shopify_prime_1 = require("shopify-prime");
const debug_service_1 = require("debug.service");
class ShopifyThemeAssetService extends shopify_prime_1.Assets {
    constructor() {
        super(...arguments);
        this.logger = new debug_service_1.DebugService(`shopify:${this.constructor.name}`);
    }
    regexIndexOf(text, re, startRegex) {
        if (startRegex) {
            return text.search(re);
        }
        else {
            const match = text.match(re);
            if (match && match[0]) {
                return text.indexOf(match[0]) + match[0].length;
            }
        }
    }
    parseSection(asset) {
        const startSchema = this.regexIndexOf(asset.value, /{%\s*?schema\s*?%}/gm, false);
        const endSchema = this.regexIndexOf(asset.value, /{%\s*?endschema\s*?%}/gm, true);
        const startLiquid = 0;
        const endLiquid = this.regexIndexOf(asset.value, /{%\s*?endschema\s*?%}/gm, true);
        this.logger.debug(`startSchema: ${startSchema} endSchema: ${endSchema}`);
        if (startSchema >= 0 && endSchema >= 0) {
            const sectionSchemaString = asset.value.substring(startSchema, endSchema).trim();
            const sectionLiquidString = asset.value.substring(startLiquid, endLiquid).trim();
            let sectionSchema;
            try {
                sectionSchema = asset.value = JSON.parse(sectionSchemaString);
            }
            catch (error) {
                this.logger.debug(`error`, error, sectionSchemaString);
                return asset;
            }
            asset.json = sectionSchema;
            asset.value = sectionLiquidString;
        }
        return asset;
    }
    parseLocale(asset) {
        let sectionSchema;
        try {
            sectionSchema = JSON.parse(asset.value);
        }
        catch (error) {
            return asset;
        }
    }
    async list(id, options = {}) {
        return super.list(id, options)
            .then((assetData) => {
            assetData = assetData.filter((asset) => {
                let matches = true;
                if (options.content_type && options.content_type !== asset.content_type) {
                    matches = false;
                }
                if (options.key_starts_with && !asset.key.startsWith(options.key_starts_with)) {
                    matches = false;
                }
                return matches;
            });
            return assetData;
        });
    }
    async get(id, key, options = {}) {
        return super.get(id, key, options)
            .then((assetData) => {
            if (assetData.content_type === 'application/json') {
                assetData.json = JSON.parse(assetData.value);
            }
            if (assetData.content_type === 'text/x-liquid') {
                if (assetData.key.startsWith('sections/')) {
                    assetData = this.parseSection(assetData);
                }
            }
            return assetData;
        });
    }
}
exports.ShopifyThemeAssetService = ShopifyThemeAssetService;
//# sourceMappingURL=assets.service.js.map