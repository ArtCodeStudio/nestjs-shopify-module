import { Injectable } from '@nestjs/common';
import { Webhooks } from 'shopify-prime';
import { Webhook } from 'shopify-prime/models';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';

@Injectable()
export class WebhooksService {
  constructor(
    private shopifyModuleOptions: ShopifyModuleOptions,
  ) {}
  public create(shopifyConnect: IShopifyConnect, topic: string) {
    const webhooks = new Webhooks(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    return webhooks.create({
      address: `https://${this.shopifyModuleOptions.appHost}/webhooks/${topic}`,
      topic
    });
  }
}
