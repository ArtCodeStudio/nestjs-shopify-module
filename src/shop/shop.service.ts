import { Injectable, Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';

import { IShopifyConnect } from '../auth/interfaces/connect';
import { IShopifyShop } from './interfaces/shop';
import { DebugService } from '../../debug.service';

@Injectable()
export class ShopService {

  protected logger = new DebugService('shopify:ShopifyConnectService');

  constructor(
    @Inject('ShopifyConnectModelToken')
    private readonly shopifyConnectModel: Model<IShopifyConnect>,
  ) {}

  async findAll(): Promise<IShopifyShop[]> {
    return this.shopifyConnectModel.find().exec()
    .then((connects: IShopifyConnect[]) => {
      const shops: IShopifyShop[] = [];
      connects.forEach(connect => {
        shops.push(connect.shop);
      });
      return shops;
    });
  }

  async findByShopifyID(id: number, fields?: string[]): Promise<IShopifyShop> {
    return this.shopifyConnectModel.findOne({shopifyID: id}).exec()
    .then((connect: IShopifyConnect) => {
      let shop;
      if (fields) {
        shop = {};
        fields.forEach((property, index) => {
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
