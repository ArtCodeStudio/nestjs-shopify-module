import { SubscribeMessage, WebSocketGateway, WsResponse, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { SessionSocket } from '../interfaces/session-socket';
import { SyncService } from './sync.service';
import { Product, ProductUpdateCreate } from 'shopify-prime/models';
import { DebugService } from '../debug.service';
import { Server } from 'socket.io'

@WebSocketGateway({namespace: '/socket.io/shopify/sync'})
export class SyncGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: SocketIO.Namespace;

  protected logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    protected readonly syncService: SyncService
  ){}

  // @SubscribeMessage('start')
  // onAll(client: SessionSocket, options: ProductListOptions = {}): Observable<WsResponse<Product>> {
  //   // return this.syncService.startSync(client.handshake.session.shopifyConnect, 'start', options);
  // }

  afterInit(nsp: SocketIO.Namespace) {
    this.logger.debug('afterInit', nsp.name);
  }

  handleConnection(client: SessionSocket) {
    this.logger.debug('connect', client.id, client.handshake.session);
  }

  handleDisconnect(client: SessionSocket) {
    this.logger.debug('disconnect', client.id);
  }
}
