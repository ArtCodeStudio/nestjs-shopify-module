import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';

// Third party
import { Interfaces } from 'shopify-admin-api';
import { Server, Namespace } from 'socket.io';

// Interfaces
import { SessionSocket } from '../../interfaces/session-socket';

// Services
import { EventService } from '../../event.service';
import { DebugService } from '../../debug.service';
import { ShopifyConnectService } from '../../auth/connect.service';
import { WebhooksService } from '../../webhooks/webhooks.service';

/**
 * Rooms: `${myshopifyDomain}-app-backend`, `${myshopifyDomain}-client-theme`
 */
@WebSocketGateway({namespace: '/socket.io/shopify/api/webhooks', transports: ['websocket', 'polling'] })
export class WebhooksGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  protected logger = new DebugService(`shopify:${this.constructor.name}`);

  @WebSocketServer()
  nps: Namespace;

  constructor(
    protected readonly eventService: EventService,
    protected readonly shopifyConnectService: ShopifyConnectService,
    protected readonly webhooksService: WebhooksService,
  ) {
  }

  afterInit(nsp: SocketIO.Namespace) {
    this.logger.debug('afterInit: %s', nsp.name);

    // WORKAROUND
    this.nps.server.on('connection', this.handleConnection.bind(this))
    this.nps.server.on('disconnect', this.handleDisconnect.bind(this))

    this.eventService.on(`webhook:carts/create`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('webhook:carts/create', data);
    });

    this.eventService.on(`webhook:carts/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('carts/update', data);
    });

    this.eventService.on(`webhook:checkouts/create`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('checkouts/create', data);
    });

    this.eventService.on(`webhook:checkouts/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('checkouts/update', data);
    });

    this.eventService.on(`webhook:checkouts/delete`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('checkouts/delete', data);
    });

    this.eventService.on(`webhook:collections/create`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('collections/create', data);
    });

    this.eventService.on(`webhook:collections/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('collections/update', data);
    });

    this.eventService.on(`webhook:collections/delete`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('collections/delete', data);
    });

    this.eventService.on(`webhook:collection_listings/add`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('collection_listings/add', data);
    });

    this.eventService.on(`webhook:collection_listings/remove`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('collection_listings/remove', data);
    });

    this.eventService.on(`webhook:collection_listings/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('collection_listings/update', data);
    });

    this.eventService.on(`webhook:customers/create`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('customers/create', data);
    });

    this.eventService.on(`webhook:customers/disable`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('customers/disable', data);
    });

    this.eventService.on(`webhook:customers/enable`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('customers/enable', data);
    });

    this.eventService.on(`webhook:customers/update`, (myshopifyDomain: string, data: any) => {
      this.logger.debug('webhook:customers/update: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('customers/update', data);
    });

    this.eventService.on(`webhook:customers/delete`, (myshopifyDomain: string, data: any) => {
      this.logger.debug('webhook:customers/delete: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('customers/delete', data);
    });

    this.eventService.on(`webhook:customer_groups/create`, (myshopifyDomain: string, data: any) => {
      this.logger.debug('webhook:customer_groups/create: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('customer_groups/create', data);
    });

    this.eventService.on(`webhook:customer_groups/update`, (myshopifyDomain: string, data: any) => {
      this.logger.debug('webhook:customer_groups/update: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('customer_groups/update', data);
    });

    this.eventService.on(`webhook:customer_groups/delete`, (myshopifyDomain: string, data: any) => {
      this.logger.debug('webhook:customer_groups/delete: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('customer_groups/delete', data);
    });

    this.eventService.on(`webhook:draft_orders/create`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookDraftOrderCreate) => {
      this.logger.debug('webhook:draft_orders/create: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('draft_orders/create', data);
    });

    this.eventService.on(`webhook:draft_orders/delete`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookDraftOrderDelete) => {
      this.logger.debug('webhook:draft_orders/delete: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('draft_orders/delete', data);
    });

    this.eventService.on(`webhook:draft_orders/update`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookDraftOrderUpdate) => {
      this.logger.debug('webhook:draft_orders/update: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('draft_orders/update', data);
    });

    this.eventService.on(`webhook:fulfillments/create`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookFulfillmentCreate) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('fulfillments/create', data);
    });

    this.eventService.on(`webhook:fulfillments/update`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookFulfillmentUpdate) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('fulfillments/update', data);
    });

    this.eventService.on(`webhook:fulfillment_events/create`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('fulfillment_events/create', data);
    });

    this.eventService.on(`webhook:fulfillment_events/delete`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('fulfillment_events/delete', data);
    });

    this.eventService.on(`webhook:inventory_items/create`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('inventory_items/create', data);
    });

    this.eventService.on(`webhook:inventory_items/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('inventory_items/update', data);
    });

    this.eventService.on(`webhook:inventory_items/delete`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('inventory_items/delete', data);
    });

    this.eventService.on(`webhook:inventory_levels/connect`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('inventory_levels/connect', data);
    });

    this.eventService.on(`webhook:inventory_levels/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('inventory_levels/update', data);
    });

    this.eventService.on(`webhook:inventory_levels/disconnect`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('inventory_levels/disconnect', data);
    });

    this.eventService.on(`webhook:locations/create`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('locations/create', data);
    });

    this.eventService.on(`webhook:locations/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('locations/update', data);
    });

    this.eventService.on(`webhook:locations/delete`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('locations/delete', data);
    });

    this.eventService.on(`webhook:orders/cancelled`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookOrdersCancelled) => {
      this.logger.debug('webhook:orders/cancelled: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('orders/cancelled', data);
    });

    this.eventService.on(`webhook:orders/create`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookOrdersCreate) => {
      this.logger.debug('webhook:orders/create: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('orders/create', data);
    });

    this.eventService.on(`webhook:orders/fulfilled`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookOrdersFulfilled) => {
      this.logger.debug('webhook:orders/fulfilled: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('orders/fulfilled', data);
    });

    this.eventService.on(`webhook:orders/paid`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookOrdersPaid) => {
      this.logger.debug('webhook:orders/paid: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('orders/paid', data);
    });

    this.eventService.on(`webhook:orders/partially_fulfilled`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookOrdersPartiallyFulfilled) => {
      this.logger.debug('webhook:orders/partially_fulfilled: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('orders/partially_fulfilled', data);
    });

    this.eventService.on(`webhook:orders/updated`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookOrdersUpdated) => {
      this.logger.debug('webhook:orders/updated: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('orders/updated', data);
    });

    this.eventService.on(`webhook:orders/delete`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookOrdersDelete) => {
      this.logger.debug('webhook:orders/delete: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('orders/delete', data);
    });

    this.eventService.on(`webhook:orders/edited`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookOrdersEdited) => {
      this.logger.debug('webhook:orders/edited: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('orders/edited', data);
    });

    this.eventService.on(`webhook:order_transactions/create`, (myshopifyDomain: string, data: Interfaces.WebhooksReponse.WebhookOrderTransactionCreate) => {
      this.logger.debug('webhook:order_transactions/create: %O', data);
      nsp.to(`${myshopifyDomain}-app-backend`).emit('order_transactions/create', data);
    });

    this.eventService.on(`webhook:products/create`, (myshopifyDomain: string, product: Interfaces.Product) => {
      this.logger.debug(`Forward webhook:products/create to namespace "${myshopifyDomain}-app-backend"`)
      // For app backend users
      nsp.to(`${myshopifyDomain}-app-backend`).emit('products/create', product);

      // For theme clients (only if product is published for safety reasons)
      if (product.published_at !== null) {
        this.logger.debug(`Forward webhook:products/create to namespace "${myshopifyDomain}-client-theme"`)
        nsp.to(`${myshopifyDomain}-client-theme`).emit('products/create', product);
      }
    });

    this.eventService.on(`webhook:products/update`, (myshopifyDomain: string, product: Interfaces.Product) => {
      // For app backend users
      nsp.to(`${myshopifyDomain}-app-backend`).emit('products/update', product);

      // For theme clients (only if product is published for safety reasons)
      if (product.published_at !== null) {
        nsp.to(`${myshopifyDomain}-client-theme`).emit('products/update', product);
      }
    });

    this.eventService.on(`webhook:products/delete`, (myshopifyDomain: string, data: {id: number}) => {
      // For app backend users
      nsp.to(`${myshopifyDomain}-app-backend`).emit('products/delete', data);

      // For theme clients
      nsp.to(`${myshopifyDomain}-client-theme`).emit('products/delete', data);
    });

    this.eventService.on(`webhook:product_listings/add`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('product_listings/add', data);
    });

    this.eventService.on(`webhook:product_listings/remove`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('product_listings/remove', data);
    });
    this.eventService.on(`webhook:product_listings/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('product_listings/update', data);
    });

    this.eventService.on(`webhook:refunds/create`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('refunds/create', data);
    });

    this.eventService.on(`webhook:app/uninstalled`, (myshopifyDomain: string, data: any) => {
      // For app backend users
      nsp.to(`${myshopifyDomain}-app-backend`).emit('app/uninstalled', data);

      // For theme clients
      nsp.to(`${myshopifyDomain}-client-theme`).emit('app/uninstalled', data);
    });

    this.eventService.on(`webhook:shop/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('shop/update', data);
    });

    this.eventService.on(`webhook:themes/create`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('themes/create', data);
    });

    this.eventService.on(`webhook:themes/publish`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('themes/publish', data);
    });

    this.eventService.on(`webhook:themes/update`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('themes/update', data);
    });

    this.eventService.on(`webhook:themes/delete`, (myshopifyDomain: string, data: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('themes/delete', data);
    });
  }

  handleConnection(client: SessionSocket) {
    this.joinBackend(client);
    this.joinTheme(client);
    this.logger.debug('connect rooms: ', client.rooms);
  }

  handleDisconnect(client: SessionSocket) {
    this.logger.debug('disconnect: %d', client.id);
  }

  // Join the room for theme client visitors to receive broadcast events
  @SubscribeMessage('join-theme')
  joinTheme(@ConnectedSocket() client: SessionSocket) {
    this.logger.debug('join-theme: ', client.handshake.session.currentShop);
    if (client.handshake.session && client.handshake.session.isThemeClientRequest) {
      client.join(`${client.handshake.session.currentShop}-client-theme`);
    }
    return {}
  }

  // Join the room for app backend users to receive broadcast events
  @SubscribeMessage('join-backend')
  joinBackend(@ConnectedSocket() client: SessionSocket) {
    this.logger.debug('join-backend: ', client.handshake.session.currentShop);
    if (client.handshake.session && client.handshake.session.isAppBackendRequest && client.handshake.session.isLoggedInToAppBackend) {
      client.join(`${client.handshake.session.currentShop}-app-backend`);
    }
    return {}
  }

}
