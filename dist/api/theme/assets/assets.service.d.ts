import { Options, Models, Assets } from 'shopify-prime';
import { DebugService } from 'debug.service';
export interface CustomAssetListOptions extends Options.FieldOptions {
    key_starts_with?: string;
    content_type?: string;
}
export interface ICustomAsset extends Models.Asset {
    json?: any;
}
export declare class ShopifyThemeAssetService extends Assets {
    logger: DebugService;
    private regexIndexOf(text, re, startRegex);
    private parseSection(asset);
    private parseLocale(asset);
    list(id: number, options?: CustomAssetListOptions): Promise<Models.Asset[]>;
    get(id: number, key: string, options?: Options.FieldOptions): Promise<ICustomAsset>;
}
