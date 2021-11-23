import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';

import { IShopifyConnectDocument } from '../auth/interfaces/connect';
import { IShopifyShop } from './interfaces/shop';
import { DebugService } from '../debug.service';

@Injectable()
export class ShopService {
  protected logger = new DebugService('shopify:ShopifyConnectService');

  constructor(
    @Inject('ShopifyConnectModelToken')
    private readonly shopifyConnectModel: Model<IShopifyConnectDocument>,
  ) {}

  async findAll(): Promise<IShopifyShop[]> {
    return this.shopifyConnectModel
      .find()
      .exec()
      .then((connects: IShopifyConnectDocument[]) => {
        const shops: IShopifyShop[] = [];
        connects.forEach((connect) => {
          shops.push(connect.shop);
        });
        return shops;
      });
  }

  async findByShopifyID(id: number, fields?: string[]): Promise<IShopifyShop> {
    return this.shopifyConnectModel
      .findOne({ shopifyID: id })
      .exec()
      .then((connect: IShopifyConnectDocument) => {
        let shop;
        if (fields) {
          shop = {};
          fields.forEach((property) => {
            if (shop.hasOwnProperty(property)) {
              shop[property] = connect.shop[property];
            }
          });
        } else {
          shop = connect.shop;
        }
        return shop;
      });
  }
}
