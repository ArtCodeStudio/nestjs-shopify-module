import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventService } from '../../event.service';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { Models } from 'shopify-prime';

// https://github.com/chanlito/simple-todos/blob/c73022fb15fa47cd974057d3486207e70283579c/server/app/app.gateway.ts
@WebSocketGateway({path: '/webhooks.io'})
export class WebhooksGateway {
  @WebSocketServer() server;

  constructor(private readonly eventService: EventService) {

    this.eventService.on('app/installed', (shopifyConnect: IShopifyConnect) => {

    });

  }

  @SubscribeMessage('products/update')
  productsUpdate(client, data): Observable<WsResponse<number>> {
    return Observable.create(function(observer) {
      this.eventService.on('products/update', (product: Models.Product) => {
        observer.next(product);
      });
    });
  }

}


  // 'carts/create',
  // 'carts/update',
  // 'checkouts/create',
  // 'checkouts/update',
  // 'checkouts/delete',
  // 'collections/create',
  // 'collections/update',
  // 'collections/delete',
  // 'collection_listings/add',
  // 'collection_listings/remove',
  // 'collection_listings/update',
  // 'customers/create',
  // 'customers/disable',
  // 'customers/enable',
  // 'customers/update',
  // 'customers/delete',
  // 'customer_groups/create',
  // 'customer_groups/update',
  // 'customer_groups/delete',
  // 'draft_orders/create',
  // 'draft_orders/update',
  // 'fulfillments/create',
  // 'fulfillments/update',
  // 'fulfillment_events/create',
  // 'fulfillment_events/delete',
  // 'inventory_items/create',
  // 'inventory_items/update',
  // 'inventory_items/delete',
  // 'inventory_levels/connect',
  // 'inventory_levels/update',
  // 'inventory_levels/disconnect',
  // 'locations/create',
  // 'locations/update',
  // 'locations/delete',
  // 'orders/cancelled',
  // 'orders/create',
  // 'orders/fulfilled',
  // 'orders/paid',
  // 'orders/partially_fulfilled',
  // 'orders/updated',
  // 'orders/delete',
  // 'order_transactions/create',
  // 'products/create',
  // 'products/update',
  // 'products/delete',
  // 'product_listings/add',
  // 'product_listings/remove',
  // 'product_listings/update',
  // 'refunds/create',
  // 'app/uninstalled',
  // 'shop/update',
  // 'themes/create',
  // 'themes/publish',
  // 'themes/update',
  // 'themes/delete',