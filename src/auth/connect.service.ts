import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { IShopifyAuthProfile } from './interfaces/profile';
import { DebugService } from '../debug.service';
import { IShopifyConnect, IShopifyConnectDocument } from './interfaces/connect';
import { EventService } from '../event.service';

@Injectable()
export class ShopifyConnectService {
  protected logger = new DebugService('shopify:ShopifyConnectService');

  constructor(
    @Inject('ShopifyConnectModelToken')
    private readonly shopifyConnectModel: Model<IShopifyConnectDocument>,
    private readonly eventService: EventService,
  ) {
    // Delete connected shop on app uninstall
    this.eventService.on(
      'webhook:app/uninstalled',
<<<<<<< Updated upstream
      async (myShopifyDomain: IShopifyConnect['shop']['myshopify_domain']) => {
        this.logger.warn('webhook:app/uninstalled:', myShopifyDomain);
        this.deleteByDomain(myShopifyDomain)
=======
      async (shop: IShopifyConnect['shop']) => {
        this.logger.warn('webhook:app/uninstalled:', shop.myshopify_domain);
        this.deleteByShopifyId(shop.id)
>>>>>>> Stashed changes
          .then((result) => {
            this.logger.debug('Delete connected shop result:', result);
          })
          .catch((error: Error) => {
            this.logger.error(
<<<<<<< Updated upstream
              `[${myShopifyDomain}] Error on delete connected shop: ${error.message}`,
=======
              `[${shop.myshopify_domain}] Error on delete connected shop: ${error.message}`,
>>>>>>> Stashed changes
              error,
            );
          });
      },
    );
  }

  async connectOrUpdate(userProfile: IShopifyAuthProfile, accessToken: string) {
    this.logger.debug('connectOrUpdate', userProfile.username);
    const now = new Date();
    if (userProfile.id.toString() !== userProfile._json.shop.id.toString()) {
      throw new Error('Invalid shopify id! ' + userProfile.id);
    }
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

    return this.findByDomain(newShopifyConnect.myshopify_domain).then(
      async (user) => {
        // update
        if (user) {
          this.logger.debug(
            `update newShopifyConnect.myshopify_domain:`,
            newShopifyConnect.myshopify_domain,
          );
          return this.shopifyConnectModel
            .updateOne(
              { shopifyID: newShopifyConnect.shopifyID },
              {
                myshopify_domain: newShopifyConnect.myshopify_domain,
                accessToken: newShopifyConnect.accessToken,
                updatedAt: newShopifyConnect.updatedAt,
                // roles: newShopifyConnect.roles,
              },
            )
            .exec()
            .then((updateResult) => {
              this.logger.debug(`updateOne updateResult`, updateResult);
              return this.findByShopifyId(newShopifyConnect.shopifyID);
            });
        }
        // create
        this.logger.debug(`create`);
        return this.shopifyConnectModel
          .create(newShopifyConnect)
          .then((shopifyConnect) => {
            this.eventService.emit('app/installed', shopifyConnect);
            return shopifyConnect;
          });
      },
    );
  }

  async findAll() {
    return await this.shopifyConnectModel.find().exec();
  }

  /**
   * Find connected user by shopify domain or myshopify_domain
   * @param domain
   */
  async findByDomain(domain: string): Promise<IShopifyConnect | null> {
    if (!domain) {
      return null;
    }
    if (domain.endsWith('.myshopify.com')) {
      const query = { 'shop.myshopify_domain': domain };
      return this.shopifyConnectModel.findOne(query).exec();
    } else {
      const query: any = { 'shop.domain': domain };
      return this.shopifyConnectModel.findOne(query).exec();
    }
  }

  /**
   * Find connected user by shopify id
   * @param id
   */
  async findByShopifyId(shopifyID: number) {
    return this.shopifyConnectModel
      .findOne({ shopifyID })
      .exec()
      .then((user: IShopifyConnect) => {
        // (`findByShopifyId user.myshopify_domain:`, user.myshopify_domain);
        return user;
      });
  }

  /**
   * Delete connected shop by shopify id
   * @param domain
   */
  async deleteByShopifyId(shopifyID: number) {
    return this.shopifyConnectModel.findOneAndDelete({ shopifyID }).exec();
  }
<<<<<<< Updated upstream

  /**
   * Delete connected shop by shopify id
   * @param domain
   */
  async deleteByDomain(domain: string) {
    const shopifyConnect = await this.findByDomain(domain);
    return this.shopifyConnectModel
      .findOneAndDelete({ shopifyID: shopifyConnect.shopifyID })
      .exec();
  }
=======
>>>>>>> Stashed changes
}
