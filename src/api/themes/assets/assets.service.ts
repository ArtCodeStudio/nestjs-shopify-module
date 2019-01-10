import { Inject, Injectable } from '@nestjs/common';
import { Options, Models, Assets } from 'shopify-prime';
import { AssetDocument } from '../../interfaces/mongoose/asset.schema';
import { IShopifyConnect } from '../../../auth/interfaces/connect';
import { Model, Types } from 'mongoose';
import { DebugService } from 'debug.service';

export interface CustomAssetListOptions extends Options.FieldOptions {
  key_starts_with?: string;
  content_type?: string;
}

export interface ICustomAsset extends Models.Asset {
  json?: any;
}

@Injectable()
export class AssetsService {
  constructor(
    @Inject('AssetModelToken')
    private readonly assetModel: Model<AssetDocument>,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  // https://stackoverflow.com/a/273810/1465919
  // https://stackoverflow.com/a/5440771/1465919
  private regexIndexOf(text: string, re: RegExp, startRegex: boolean) {
    if (startRegex) {
      return text.search(re);
    } else {
      const match = text.match(re);
      if (match && match[0]) {
        return text.indexOf(match[0]) + match[0].length;
      }
    }
  }

  private parseSection(asset: ICustomAsset) {
    const startSchema = this.regexIndexOf(asset.value, /{%\s*?schema\s*?%}/gm, false);
    const endSchema = this.regexIndexOf(asset.value, /{%\s*?endschema\s*?%}/gm, true);
    const startLiquid = 0;
    const endLiquid = this.regexIndexOf(asset.value, /{%\s*?endschema\s*?%}/gm, true);
    // this.logger.debug(`startSchema: ${startSchema} endSchema: ${endSchema}`);
    if (startSchema >= 0 && endSchema >= 0) {
      const sectionSchemaString = asset.value.substring(startSchema, endSchema).trim();
      const sectionLiquidString = asset.value.substring(startLiquid, endLiquid).trim();
      let sectionSchema;
      try {
        sectionSchema = asset.value = JSON.parse(sectionSchemaString);
      } catch (error) {
        this.logger.error(error, sectionSchemaString);
        // if parse json fails return normal asset file
        return asset;
      }
      // json is just the schema stuff
      asset.json = sectionSchema;

      // value ins only the liquid stuff
      asset.value = sectionLiquidString;
    }
    return asset;
  }

  private parseLocale(asset: ICustomAsset) {
    let sectionSchema;
    try {
      sectionSchema = JSON.parse(asset.value);
    } catch (error) {
      // if parse json fails return normal asset file
      return asset;
    }
  }

  async list(user: IShopifyConnect, id: number, options: CustomAssetListOptions = {}): Promise<Models.Asset[]> {
    const assets = new Assets(user.myshopify_domain, user.accessToken);
    return assets.list(id, options)
    .then((assetData) => {
      // this.logger.debug('assetData', assetData);
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

  async get(user: IShopifyConnect, id: number, key: string, options: Options.FieldOptions = {}) {
    const assets = new Assets(user.myshopify_domain, user.accessToken);
    return assets.get(id, key, options)
    .then((assetData: ICustomAsset) => {
      // this.logger.debug(`assetData`, assetData);
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
