import { SubscribeMessage, WebSocketGateway, WsResponse, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { SessionSocket } from '../../interfaces/session-socket';
import { ProductsService, ProductListOptions, ProductCountOptions } from './products.service';
import { Product, ProductUpdateCreate } from 'shopify-prime/models';
import { DebugService } from '../../debug.service';
import { Server } from 'socket.io'

@WebSocketGateway({namespace: '/socket.io/shopify/api/products'})
export class ProductsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: SocketIO.Namespace;

  protected logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    protected readonly productsService: ProductsService
  ){}

  @SubscribeMessage('all')
  onAll(client: SessionSocket, options: ProductListOptions = {}): Observable<WsResponse<Product>> {
    return this.productsService.listAllFromShopifyObservable(client.handshake.session.shopifyConnect, 'all', options);
  }

  afterInit(nsp: SocketIO.Namespace) {
    
    this.logger.debug('afterInit', nsp.name);
    // WORKAROUND
    // nsp.on('connection', this.handleConnection.bind(this));
    // nsp.on('disconnect', this.handleDisconnect.bind(this));
  }

  handleConnection(client: SessionSocket) {
    this.logger.debug('connect', client, client.id, client.handshake.session);
    // Join the room (the room name is the myshopify domain)
    // if (client.handshake.session && client.handshake.session.isAppBackendRequest && client.handshake.session.isLoggedInToAppBackend) {
    //   client.join(`${client.handshake.session.shop}-app-backend`);
    // }

    // if (client.handshake.session && client.handshake.session.isThemeClientRequest) {
    //   client.join(`${client.handshake.session.shop}-client-theme`);
    // }
  }

  handleDisconnect(client: SessionSocket) {
    this.logger.debug('disconnect', client.id);
  }
}
