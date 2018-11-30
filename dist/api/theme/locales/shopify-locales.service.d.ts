import { ShopifyThemeAssetService, CustomAssetListOptions, ICustomAsset } from '../assets/assets.service';
import { Options } from 'shopify-prime';
import { DebugService } from 'debug.service';
export interface ILocales {
    [langcode: string]: any;
}
export interface ILocaleFile extends ICustomAsset {
    json?: any;
    lang_code?: string;
    is_default?: boolean;
    locales?: ILocales;
}
export interface CustomLocaleListOptions extends CustomAssetListOptions {
    lang_code?: string;
}
export declare class ShopifyLocalesService {
    logger: DebugService;
    assetService: ShopifyThemeAssetService;
    shopDomain: string;
    constructor(shopDomain: string, accessToken: string);
    getLocalFile(id: number, filename: string, options?: Options.FieldOptions): Promise<ILocaleFile>;
    listSections(id: number, options?: CustomAssetListOptions): Promise<ILocaleFile[]>;
    getSectionFile(id: number, filename: string, options?: CustomAssetListOptions): Promise<ILocaleFile>;
    private getSectionAll(id, options?);
    getByLangCode(id: number, langCode: string, options?: Options.FieldOptions): Promise<ILocaleFile>;
    getAll(id: number, options?: CustomLocaleListOptions): Promise<ILocales>;
    get(id: number, properties?: string[], options?: Options.FieldOptions): Promise<{
        [x: string]: any;
    }>;
    list(id: number, options?: CustomLocaleListOptions): Promise<ILocaleFile[]>;
    private parseLangCode(locale);
}
