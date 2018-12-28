import { Injectable, Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { IShopifyAuthProfile } from './interfaces/profile';
import { DebugService } from '../debug.service';
import { IShopifyConnect } from './interfaces/connect';
import { EventService } from '../event.service';

@Injectable()
export class ShopifyConnectService {

  protected logger = new DebugService('shopify:ShopifyConnectService');

  constructor(
    @Inject('ShopifyConnectModelToken')
    private readonly shopifyConnectModel: Model<IShopifyConnect>,
    private readonly event: EventService,
  ) {}

  async connectOrUpdate(userProfile: IShopifyAuthProfile, accessToken: string) {
    this.logger.debug('connectOrUpdate', userProfile.username);
    const now = new Date();
    const newShopifyConnect = new this.shopifyConnectModel({
      // _id: Types.ObjectId(userProfile.id),
      shopifyID: Number(userProfile.id),
      myshopify_domain: userProfile._json.shop.myshopify_domain,
      shop: userProfile._json.shop,
      accessToken,
      updatedAt: now,
      createdAt: now,
      roles: ['shopify-staff-member'],
    });

    return this.findByDomain(newShopifyConnect.myshopify_domain)
    .then(async (user) => {
      // update
      if (user) {
        this.logger.debug(`update newShopifyConnect.myshopify_domain:`, newShopifyConnect.myshopify_domain);
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
      return this.shopifyConnectModel.create(newShopifyConnect)
      .then((shopifyConnect) => {
        this.event.emit('app/installed', shopifyConnect);
        return shopifyConnect;
      });
    });
  }

  async findAll() {
    return await this.shopifyConnectModel.find().exec();
  }

  /**
   * Find connected user by shopify domain or myshopify_domain
   * @param domain
   */
  async findByDomain(domain: string): Promise<IShopifyConnect | null> {
    if (domain.endsWith('.myshopify.com')) {
      const query = {'shop.myshopify_domain': domain};
      return this.shopifyConnectModel.findOne(query).exec();
    } else {
      let query: any = {'shop.domain': domain};
      return this.shopifyConnectModel.findOne(query).exec()
    }
  }

  async findByShopifyId(id: number) {
    return this.shopifyConnectModel.findOne({shopifyID: id}).exec()
    .then((user: IShopifyConnect) => {
      // (`findByShopifyId user.myshopify_domain:`, user.myshopify_domain);
      return user;
    });
  }

}