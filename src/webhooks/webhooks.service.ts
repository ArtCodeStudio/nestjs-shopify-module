import { Injectable, Inject } from '@nestjs/common';
import { Webhooks, Enums, Interfaces } from 'shopify-admin-api';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { SHOPIFY_MODULE_OPTIONS } from '../shopify.constants';
import { EventService } from '../event.service';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';
import { SessionSocket } from '../interfaces/session-socket';
import { WebhookError } from '../interfaces/webhook';
import { WsResponse } from '@nestjs/websockets';
import { Observable, Observer, timer, MonoTypeOperatorFunction } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable()
export class WebhooksService {
  static webhookObservables: {
    [key: string]: Observable<WsResponse<any>>;
  };
  protected logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions,
    protected readonly eventService: EventService,
    protected readonly shopifyConnectService: ShopifyConnectService,
  ) {

    // Auto subscripe webhooks from config on app install
    eventService.on('app/installed', (shopifyConnect: IShopifyConnect) => {
      for (const topic of this.shopifyModuleOptions.shopify.webhooks.autoSubscribe) {
        this.logger.debug(`[${shopifyConnect.myshopify_domain}] Auto subscribe webhook ${topic}`);
        this.create(shopifyConnect, topic)
        .then((result) => {
          this.logger.debug('app/installed result: %O', result);
        })
        .catch((error: WebhookError) => {
          this.logger.error(`[${shopifyConnect.myshopify_domain}] Error on subscribe webhook ${topic}: ${error.message}`, error.errors);
        });
      }
    });

    // Auto unsubscripe webhooks from config on app uninstall
    eventService.on('app/uninstalled', async (shopifyConnect: IShopifyConnect) => {
      this.deleteAll(shopifyConnect)
      .then((result) => {
        this.logger.debug('unsubscribed webhooks', result);
      })
      .catch((error: WebhookError) => {
        this.logger.error(`[${shopifyConnect.myshopify_domain}] Error on unsubscribe webhooks: ${error.message}`, error.errors);
      });
    });

    // Recreate all auto subscripe webhooks from config on app start
    shopifyConnectService.findAll()
    .then((shopifyConnects: IShopifyConnect[]) => {
      for (const shopifyConnect of shopifyConnects) {
        for (const topic of this.shopifyModuleOptions.shopify.webhooks.autoSubscribe) {
          this.logger.debug(`[${shopifyConnect.myshopify_domain}] Auto subscribe webhook ${topic}`);
          this.create(shopifyConnect, topic)
          .then((result) => {
            this.logger.debug('result: %O', result);
          })
          .catch((error: WebhookError) => {
            // Ignore if the webhook is already subscribed
            if (error.statusCode === 422 && error.errors.address && error.errors.address[0].toLocaleLowerCase().includes("for this topic has already been taken")) {
              // this.logger.debug(error);
            } else {
              this.logger.error(`[${shopifyConnect.myshopify_domain}] Error on subscribe webhook ${topic}: ${error.message}`, error.errors);
            }
          });
        }
      }
    });
  }

  public async create(shopifyConnect: IShopifyConnect, topic: Enums.WebhookTopic) {
    const webhooks = new Webhooks(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    const address = `https://${this.shopifyModuleOptions.app.host}/webhooks/${topic}`;
    this.logger.debug("create with address: " + address);
    return webhooks.create({
      address,
      topic,
      format: "json",
    });
  }

  public async delete(shopifyConnect: IShopifyConnect, id: number) {
    const webhooks = new Webhooks(shopifyConnect.myshopify_domain, shopifyConnect.accessToken);
    return webhooks.delete(id);
  }

  public async deleteAll(shopifyConnect: IShopifyConnect) {
    const subscribedWebhooks = await this.list(shopifyConnect);
    for (const webhook of subscribedWebhooks) {
      this.logger.debug(`[${shopifyConnect.myshopify_domain}] Auto unsubscribe webhook ${webhook.topic}`);
      this.delete(shopifyConnect, webhook.id)
      .then((result) => {
        this.logger.debug('unsubscribed webhook', result);
      })
      .catch((error: WebhookError) => {
        this.logger.error(`[${shopifyConnect.myshopify_domain}] Error on unsubscribe webhook ${webhook.topic} with id: ${webhook.id}: ${error.message}`, error.errors);
      });
    }
  }


  public async list(user: IShopifyConnect): Promise<Interfaces.Webhook[]> {
    const webhooks = new Webhooks(user.myshopify_domain, user.accessToken);
    return webhooks.list();
  }

  public createWebsocket(client: SessionSocket, topic: Enums.WebhookTopic): Observable<WsResponse<any>> {
    const webhookEventName = `webhook:${client.handshake.session.currentShop}:${topic}`;
    const unscripeEventName = `${webhookEventName}:unsubscribe`;
    // // Return cached Observable when available
    // if (WebhooksService.webhookObservables[webhookEventName]) {
    //   return WebhooksService.webhookObservables[webhookEventName];
    // }
    try {
      return new Observable<WsResponse<any>>((observer) => {
        this.eventService.on(webhookEventName, (data: any) => {
          this.logger.debug(webhookEventName, data);
          observer.next({
            event: topic,
            data,
          });
        });
        this.eventService.on(unscripeEventName, () => {
          this.logger.debug(unscripeEventName);
          observer.complete();
        });
      })
      .pipe<WsResponse<any>>(this.takeUntilOneDay()); // Stop after 24 hours
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
    // Cache observer
    // WebhooksService.webhookObservables[webhookEventName] = webhookOberservable;
    // return WebhooksService.webhookObservables[webhookEventName];
  }

  public deleteWebsocket(client: SessionSocket, topic: Enums.WebhookTopic): void {
    const webhookEventName = `webhook:${client.handshake.session.currentShop}:${topic}`;
    const unscripeEventName = `${webhookEventName}:unsubscribe`;
    // Emit unscripe event to complete the oberservable
    this.eventService.emit(unscripeEventName);
  }

  public getTopics() {
    return [
      {
        name: 'carts/create',
      },
      {
        name: 'carts/update',
      },
      {
        name: 'checkouts/create',
      },
      {
        name: 'checkouts/update',
      },
      {
        name: 'checkouts/delete',
      },
      {
        name: 'collections/create',
      },
      {
        name: 'collections/update',
      },
      {
        name: 'collections/delete',
      },
      {
        name: 'collection_listings/add',
      },
      {
        name: 'collection_listings/remove',
      },
      {
        name: 'collection_listings/update',
      },
      {
        name: 'customers/create',
      },
      {
        name: 'customers/disable',
      },
      {
        name: 'customers/enable',
      },
      {
        name: 'customers/update',
      },
      {
        name: 'customers/delete',
      },
      {
        name: 'customer_groups/create',
      },
      {
        name: 'customer_groups/update',
      },
      {
        name: 'customer_groups/delete',
      },
      {
        name: 'draft_orders/create',
      },
      {
        name: 'draft_orders/update',
      },
      {
        name: 'fulfillments/create',
      },
      {
        name: 'fulfillments/update',
      },
      {
        name: 'fulfillment_events/create',
      },
      {
        name: 'fulfillment_events/delete',
      },
      {
        name: 'inventory_items/create',
      },
      {
        name: 'inventory_items/update',
      },
      {
        name: 'inventory_items/delete',
      },
      {
        name: 'inventory_levels/connect',
      },
      {
        name: 'inventory_levels/update',
      },
      {
        name: 'inventory_levels/disconnect',
      },
      {
        name: 'locations/create',
      },
      {
        name: 'locations/update',
      },
      {
        name: 'locations/delete',
      },
      {
        name: 'orders/cancelled',
      },
      {
        name: 'orders/create',
      },
      {
        name: 'orders/fulfilled',
      },
      {
        name: 'orders/paid',
      },
      {
        name: 'orders/partially_fulfilled',
      },
      {
        name: 'orders/updated',
        secureForClients: true,
      },
      {
        name: 'orders/delete',
        secureForClients: true,
      },
      {
        name: 'order_transactions/create',
      },
      {
        name: 'products/create',
        secureForClients: true,
      },
      {
        name: 'products/update',
        secureForClients: true,
      },
      {
        name: 'products/delete',
        secureForClients: true,
      },
      {
        name: 'product_listings/add',
      },
      {
        name: 'product_listings/remove',
      },
      {
        name: 'product_listings/update',
      },
      {
        name: 'refunds/create',
      },
      {
        name: 'app/uninstalled',
        secureForClients: true,
      },
      {
        name: 'shop/update',
      },
      {
        name: 'themes/create',
      },
      {
        name: 'themes/publish',
      },
      {
        name: 'themes/update',
      },
      {
        name: 'themes/delete',
      },
    ];
  }

  protected takeUntilOneDay(): MonoTypeOperatorFunction<WsResponse<any>> {
    return takeUntil<WsResponse<any>>(timer(1000 * 60 * 60 * 24));
  }

}
