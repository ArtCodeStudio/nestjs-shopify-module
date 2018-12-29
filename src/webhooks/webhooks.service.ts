import { Injectable, Inject } from '@nestjs/common';
import { Webhooks } from 'shopify-prime';
import { Webhook } from 'shopify-prime/models';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { SHOPIFY_MODULE_OPTIONS } from '../shopify.constants'
import { EventService } from '../event.service';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';

@Injectable()
export class WebhooksService {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions,
    protected readonly eventService: EventService,
    protected readonly shopifyConnectService: ShopifyConnectService,
  ) {

    // Auto subscripe webhooks from config on app install
    eventService.on('app/installed', (shopifyConnect: IShopifyConnect) => {
      for (const topic of this.shopifyModuleOptions.webhooks.autoSubscribe) {
        this.logger.debug(`[${shopifyConnect.myshopify_domain}] Auto subscribe webhook ${topic}`);
        this.create(shopifyConnect, topic)
        .then((result) => {
          this.logger.debug(result);
        })
        .catch((error: Error) => {
          this.logger.error(`[${shopifyConnect.myshopify_domain}] Error on subscribe webhook ${topic}: ${error.message}`);
        });
      }
    });

    // Recreate all auto subscripe webhooks from config on app start
    shopifyConnectService.findAll()
    .then((shopifyConnects: IShopifyConnect[]) => {
      for (const shopifyConnect of shopifyConnects) {
        for (const topic of this.shopifyModuleOptions.webhooks.autoSubscribe) {
          this.logger.debug(`[${shopifyConnect.myshopify_domain}] Auto subscribe webhook ${topic}`);
          this.create(shopifyConnect, topic)
          .then((result) => {
            this.logger.debug(result);
          })
          .catch((error: Error) => {
            this.logger.error(`[${shopifyConnect.myshopify_domain}] Error on subscribe webhook ${topic}: ${error.message}`);
          });
        }
      }
    });
  }

  public create(shopifyConnect: IShopifyConnect, topic: string) {
    const webhooks = new Webhooks(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    return webhooks.create({
      address: `https://${this.shopifyModuleOptions.appHost}/webhooks/${topic}`,
      topic
    });
  }

  public async list(user: IShopifyConnect): Promise<Webhook[]> {
    const webhooks = new Webhooks(user.myshopify_domain, user.accessToken);
    return webhooks.list();
  }
}
