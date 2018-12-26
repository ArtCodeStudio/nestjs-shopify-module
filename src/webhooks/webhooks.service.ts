import { Injectable } from '@nestjs/common';
import { Webhooks } from 'shopify-prime';
import { Webhook } from 'shopify-prime/models';
import { IShopifyConnect } from '../auth/interfaces/connect';

@Injectable()
export class WebhooksService {
  public create(shopifyConnect: IShopifyConnect, topic: string) {
    const webhooks = new Webhooks(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    webhooks.create({
      address: 'https://gobd-next.artandcode.studio/webhooks/'+topic,
      topic
    });
  }
}
