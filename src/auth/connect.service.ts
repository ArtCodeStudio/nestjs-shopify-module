import { Injectable, Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { IShopifyAuthProfile } from './interfaces/profile';
import { DebugService } from '../debug.service';
import { IShopifyConnect } from './interfaces/connect';

@Injectable()
export class ShopifyConnectService {

  protected logger = new DebugService('shopify:ShopifyConnectService');

  constructor(
    @Inject('ShopifyConnectModelToken')
    private readonly shopifyConnectModel: Model<IShopifyConnect>,
  ) {}

  /**
   * @see http://typeorm.io/#/repository-api
   */
  async connectOrUpdate(userProfile: IShopifyAuthProfile, accessToken) {
    this.logger.debug('connectOrUpdate', userProfile.username);
    const now = new Date();
    const newShopifyConnect = new this.shopifyConnectModel({
      _id: Types.ObjectId(userProfile.id),
      shopifyID: Number(userProfile.id),
      myshopify_domain: userProfile._json.shop.myshopify_domain,
      shop: userProfile._json.shop,
      accessToken,
      updatedAt: now,
      createdAt: now,
      roles: ['shopify-staff-member'],
    });

    return this.findByDomain(newShopifyConnect.myshopify_domain)
    .then((user) => {
      // update
      if (user) {
        this.logger.debug(`update`, newShopifyConnect);
        return this.shopifyConnectModel.updateOne({shopifyID: newShopifyConnect.shopifyID}, {
          myshopify_domain: newShopifyConnect.myshopify_domain,
          accessToken: newShopifyConnect.accessToken,
          updatedAt: newShopifyConnect.updatedAt,
          // roles: newShopifyConnect.roles,
        }).exec()
        .then((updateResult) => {
          this.logger.debug(`updateOne updateResult`, updateResult);
          return this.findByShopifyId(newShopifyConnect.shopifyID);
        });
      }
      // create
      this.logger.debug(`create`);
      return this.shopifyConnectModel.create(newShopifyConnect);
    });
  }

  async findAll() {
    return await this.shopifyConnectModel.find().exec();
  }

  /**
   * Find connected user by shopify domain or myshopify_domain
   * @param domain
   */
  async findByDomain(domain: string) {
    let query: any = {'shop.domain': domain};
    return this.shopifyConnectModel.findOne(query).exec()
    .then((shopifyConnect) => {
      if (shopifyConnect === null) {
        query = {'shop.myshopify_domain': domain};
        return this.shopifyConnectModel.findOne(query).exec();
      }
      return shopifyConnect;
    });
  }

  async findByShopifyId(id: number) {
    return this.shopifyConnectModel.findOne({shopifyID: id}).exec()
    .then((user: IShopifyConnect) => {
      this.logger.debug(`findByShopifyId`, user);
      return user;
    });
  }

}