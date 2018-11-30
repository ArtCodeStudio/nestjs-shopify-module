"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assets_service_1 = require("../assets/assets.service");
const debug_service_1 = require("debug.service");
const p_map_1 = require("p-map");
const path = require("path");
const merge = require("deepmerge");
class ShopifyLocalesService {
    constructor(shopDomain, accessToken) {
        this.logger = new debug_service_1.DebugService(`shopify:${this.constructor.name}`);
        this.assetService = new assets_service_1.ShopifyThemeAssetService(shopDomain, accessToken);
    }
    async getLocalFile(id, filename, options = {}) {
        const key = `locales/${filename}`;
        this.logger.debug('getLocalFile', filename);
        return this.assetService.get(id, key, options)
            .then((asset) => {
            const locale = this.parseLangCode(asset);
            return {
                key: locale.key,
                locales: locale.json,
                size: locale.size,
                theme_id: locale.theme_id,
                lang_code: locale.lang_code,
                is_default: locale.is_default,
            };
        });
    }
    async listSections(id, options = {}) {
        options.content_type = 'text/x-liquid';
        options.key_starts_with = 'sections/';
        return this.assetService.list(id, options)
            .then((assets) => {
            this.logger.debug('assets', assets);
            const locales = assets;
            locales.forEach((locale) => {
                locale = this.parseLangCode(locale);
            });
            return assets;
        });
    }
    async getSectionFile(id, filename, options = {}) {
        const key = `sections/${filename}`;
        return this.assetService.get(id, key, options)
            .then((asset) => {
            let locales = null;
            if (asset.json && asset.json.locales) {
                locales = asset.json.locales;
            }
            return {
                key: asset.key,
                locales,
                size: asset.size,
                theme_id: asset.theme_id,
                lang_code: null,
                is_default: null,
            };
        });
    }
    async getSectionAll(id, options = {}) {
        return this.listSections(id, options)
            .then(async (sectionLocales) => {
            const result = await p_map_1.default(sectionLocales, async (sectionLocale) => {
                const filename = path.basename(sectionLocale.key);
                return await this.getSectionFile(id, filename);
            });
            return result;
        })
            .then((sectionLocales) => {
            const mergedSectionLocales = {};
            sectionLocales.forEach((sectionLocale) => {
                if (!sectionLocale || !sectionLocale.locales) {
                    return;
                }
                const filename = path.basename(sectionLocale.key);
                const filenameWithoutExtion = path.parse(filename).name;
                Object.keys(sectionLocale.locales).forEach((langcode) => {
                    if (!sectionLocale.locales || !sectionLocale.locales[langcode]) {
                        return;
                    }
                    if (!mergedSectionLocales[langcode]) {
                        mergedSectionLocales[langcode] = {};
                    }
                    if (!mergedSectionLocales[langcode].sections) {
                        mergedSectionLocales[langcode].sections = {};
                    }
                    mergedSectionLocales[langcode].sections[filenameWithoutExtion] = sectionLocale.locales[langcode];
                });
            });
            return mergedSectionLocales;
        });
    }
    async getByLangCode(id, langCode, options = {}) {
        let filename = `${langCode}.json`;
        return this.getLocalFile(id, filename, options)
            .then((locale) => {
            return locale;
        })
            .catch(async () => {
            filename = `${langCode}.default.json`;
            return this.getLocalFile(id, filename, options)
                .then((locale) => {
                return locale;
            });
        });
    }
    async getAll(id, options = {}) {
        return this.list(id, options)
            .then(async (locales) => {
            const result = await p_map_1.default(locales, async (locale) => {
                const filename = path.basename(locale.key);
                return await this.getLocalFile(id, filename);
            });
            return result;
        })
            .then((locales) => {
            const mergedLocales = {};
            locales.forEach((locale) => {
                mergedLocales[locale.lang_code] = locale.locales;
            });
            return mergedLocales;
        });
    }
    async get(id, properties, options = {}) {
        return this.getAll(id, options)
            .then(async (mergedLocales) => {
            return this.getSectionAll(id, options)
                .then(async (mergedSectionLocales) => {
                return merge(mergedSectionLocales, mergedLocales);
            });
        })
            .then((mergedLocales) => {
            if (properties && properties.length) {
                this.logger.debug('properties', properties);
                for (const property of properties) {
                    this.logger.debug('property', property);
                    if (mergedLocales[property]) {
                        mergedLocales = mergedLocales[property];
                    }
                    else {
                        this.logger.debug('null on', property);
                        return null;
                    }
                }
            }
            return mergedLocales;
        });
    }
    async list(id, options = {}) {
        options.content_type = 'application/json';
        options.key_starts_with = 'locales/';
        return this.assetService.list(id, options)
            .then((_assets) => {
            const assets = _assets;
            assets.forEach((locale) => {
                locale = this.parseLangCode(locale);
            });
            return assets;
        })
            .then((assets) => {
            assets = assets.filter((asset) => {
                let matches = true;
                if (options.lang_code && options.lang_code !== asset.lang_code) {
                    matches = false;
                }
                if (options.key_starts_with && !asset.key.startsWith(options.key_starts_with)) {
                    matches = false;
                }
                return matches;
            });
            return assets;
        });
    }
    parseLangCode(locale) {
        if (locale.key.indexOf('sections/') >= 0) {
            locale.is_default = true;
            locale.lang_code = null;
            return null;
        }
        locale.lang_code = locale.key.slice(8, -5);
        const defaultStrIndex = locale.lang_code.indexOf('.default');
        if (defaultStrIndex >= 0) {
            locale.is_default = true;
            locale.lang_code = locale.lang_code.slice(0, -8);
        }
        else {
            locale.is_default = false;
        }
        return locale;
    }
}
exports.ShopifyLocalesService = ShopifyLocalesService;
//# sourceMappingURL=shopify-locales.service.js.map