import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { UseGuards} from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventService } from '../../event.service';
import { DebugService } from '../../debug.service';
import { IShopifyConnect } from '../../auth/interfaces/connect';
import { SessionSocket } from '../../interfaces/session-socket';
import { Models } from 'shopify-prime';
import { ShopifyApiGuard } from '../../guards/shopify-api.guard';
import { Roles } from '../../guards/roles.decorator';
import { WebhooksService } from '../../webhooks/webhooks.service';

@WebSocketGateway({path: '/api/webhooks'})
export class WebhooksGateway {

  @WebSocketServer() server;

  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    private readonly eventService: EventService,
    private readonly webhooksService: WebhooksService,
  ) {
    this.eventService.on('app/installed', (shopifyConnect: IShopifyConnect) => {

    });
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('carts/create')
  cartsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'carts/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('carts/update')
  cartsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'carts/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('checkouts/create')
  checkoutsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'checkouts/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('checkouts/update')
  checkoutsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'checkouts/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('checkouts/delete')
  checkoutsDelete(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'checkouts/delete');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('collections/create')
  collectionsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'collections/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('collections/update')
  collectionsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'collections/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('collections/delete')
  collectionsDelete(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'collections/delete');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('collection_listings/add')
  collectionListingsAdd(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'collection_listings/add');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('collection_listings/remove')
  collectionListingsRemove(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'collection_listings/remove');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('collection_listings/update')
  collectionListingsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'collection_listings/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('customers/create')
  customersCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'customers/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('customers/disable')
  customersDisable(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'customers/disable');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('customers/enable')
  customersEnable(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'customers/enable');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('customers/update')
  customersUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'customers/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('customers/delete')
  customersDelete(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'customers/delete');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('customer_groups/create')
  customerGroupsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'customer_groups/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('customer_groups/update')
  customerGroupsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'customer_groups/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('customer_groups/delete')
  customerGroupsDelete(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'customer_groups/delete');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('draft_orders/create')
  draftOrdersCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'draft_orders/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('draft_orders/update')
  draftOrdersUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'draft_orders/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('fulfillments/create')
  fulfillmentsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'fulfillments/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('fulfillments/update')
  fulfillmentsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'fulfillments/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('fulfillment_events/create')
  fulfillmentEventsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'fulfillment_events/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('fulfillment_events/delete')
  fulfillmentEventsDelete(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'fulfillment_events/delete');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('inventory_items/create')
  inventoryItemsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'inventory_items/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('inventory_items/update')
  inventoryItemsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'inventory_items/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('inventory_items/delete')
  inventoryItemsDelete(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'inventory_items/delete');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('inventory_levels/connect')
  inventoryLevelsConnect(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'inventory_levels/connect');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('inventory_levels/update')
  inventoryLevelsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'inventory_levels/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('inventory_levels/disconnect')
  inventoryLevelsDisconnect(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'inventory_levels/disconnect');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('locations/create')
  locationsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'locations/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('locations/update')
  locationsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'locations/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('locations/delete')
  locationsDelete(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'locations/delete');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('orders/cancelled')
  ordersCancelled(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'orders/cancelled');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('orders/create')
  ordersCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'orders/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('orders/fulfilled')
  ordersFulfilled(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'orders/fulfilled');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('orders/paid')
  ordersPaid(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'orders/paid');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('orders/partially_fulfilled')
  ordersPartiallyFulfilled(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'orders/partially_fulfilled');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('orders/updated')
  ordersUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'orders/updated');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('orders/delete')
  ordersDelete(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'orders/delete');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('order_transactions/create')
  orderTransactionsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'order_transactions/create');
  }

  /**
   * Webhook products/create
   * @param client socket.io socket object
   * @param data
   * 
   * @todo Get product and check published_status for security reasons
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @SubscribeMessage('products/create')
  productsCreate(client: SessionSocket, data: any): Observable<WsResponse<Models.Product>> {
    return this.webhooksService.createWebsocket(client, 'products/create');
  }

  /**
   * Webhook products/update
   * @param client socket.io socket object
   * @param data
   * 
   * @todo Get product and check published_status for security reasons
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @SubscribeMessage('products/update')
  productsUpdate(client: SessionSocket, data: any): Observable<WsResponse<Models.Product>> {
    return this.webhooksService.createWebsocket(client, 'products/update');
  }

  /**
   * Webhook products/delete
   * @param client socket.io socket object
   * @param data
   * 
   * @todo Get product and check published_status for security reasons
   */
  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend
  @SubscribeMessage('products/delete')
  productsDelete(client: SessionSocket, data: any): Observable<WsResponse<{id: string}>> {
    return this.webhooksService.createWebsocket(client, 'products/delete');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('product_listings/add')
  productListingsAdd(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'product_listings/add');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('product_listings/remove')
  productListingsRemove(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'product_listings/remove');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('product_listings/update')
  productListingsUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'product_listings/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('refunds/create')
  refundsCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'refunds/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles() // Allowed from shop frontend and backend
  @SubscribeMessage('app/uninstalled')
  appUninstalled(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'app/uninstalled');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('shop/update')
  shopUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'shop/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('themes/create')
  themesCreate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'themes/create');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('themes/publish')
  themesPublish(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'themes/publish');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('themes/update')
  themesUpdate(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'themes/update');
  }

  @UseGuards(ShopifyApiGuard)
  @Roles('shopify-staff-member') // Allowed only from app backend
  @SubscribeMessage('themes/delete')
  themesDelete(client: SessionSocket, data: any): Observable<WsResponse<any>> {
    return this.webhooksService.createWebsocket(client, 'themes/delete');
  }

}

