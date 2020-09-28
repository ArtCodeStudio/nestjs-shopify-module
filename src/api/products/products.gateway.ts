import {
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { IShopifySyncProductListOptions,  } from '../interfaces';
import { ProductsService } from './products.service';
import { Interfaces } from 'shopify-admin-api';
import { DebugService } from '../../debug.service';
import { IShopifyConnect, SessionSocket } from '../../interfaces';

@WebSocketGateway({namespace: '/socket.io/shopify/api/products'})
export class ProductsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: SocketIO.Namespace;

  protected logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    protected readonly productsService: ProductsService,
  ){}

  @SubscribeMessage('all')
  onAll(client: SessionSocket, options: IShopifySyncProductListOptions = {}): Observable<WsResponse<Partial<Interfaces.Product>>> {
    const shop = client.handshake.session.currentShop; // TODO
    let shopifyConnect: IShopifyConnect;
    if (shop) {
      shopifyConnect = client.handshake.session[`shopify-connect-${shop}`];
    }
    if (!shopifyConnect) {
      shopifyConnect = client.handshake.session.shopifyConnect; // DEPRECATED
    }
    return this.productsService.listAllFromShopifyObservable(shopifyConnect, 'all', options);
  }

  afterInit(nsp: SocketIO.Namespace) {
    // this.logger.debug('afterInit', nsp.name);
  }

  handleConnection(client: SessionSocket) {
    // this.logger.debug('connect', client.id, client.handshake.session);
  }

  handleDisconnect(client: SessionSocket) {
    this.logger.debug('disconnect', client.id);
  }
}
