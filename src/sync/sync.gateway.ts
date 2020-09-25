import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { SessionSocket } from '../interfaces/session-socket';
import { SyncService } from './sync.service';
import { DebugService } from '../debug.service';
import { EventService } from '../event.service';
import {
  SyncProgressDocument,
} from '../interfaces';

@WebSocketGateway({namespace: '/socket.io/shopify/sync'})
export class SyncGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: SocketIO.Namespace;

  protected logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor(
    protected readonly eventService: EventService,
    protected readonly syncService: SyncService,
  ){}

  // @SubscribeMessage('start')
  // onAll(client: SessionSocket, options: ProductListOptions = {}): Observable<WsResponse<Product>> {
  //   // return this.syncService.startSync(client.handshake.session[`shopify-connect-${session.lastShop}`], 'start', options);
  // }

  afterInit(nsp: SocketIO.Namespace) {
    // this.logger.debug('afterInit', nsp.name);

    this.eventService.on(`sync-exception`, (myshopifyDomain: string, error: any) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('sync-exception', error);
    });

    this.eventService.on(`sync`, (myshopifyDomain: string, progress: SyncProgressDocument) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('sync', progress);
    });

    this.eventService.on(`sync-ended`, (myshopifyDomain: string, progress: SyncProgressDocument) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('sync-ended', progress);
    });

    this.eventService.on(`sync-success`, (myshopifyDomain: string, progress: SyncProgressDocument) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('sync-success', progress);
    });

    this.eventService.on(`sync-failed`, (myshopifyDomain: string, progress: SyncProgressDocument) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('sync-failed', progress);
    });

    this.eventService.on(`sync-cancelled`, (myshopifyDomain: string, progress: SyncProgressDocument) => {
      nsp.to(`${myshopifyDomain}-app-backend`).emit('sync-cancelled', progress);
    });
  }

  handleConnection(client: SessionSocket) {
    // this.logger.debug('connect', client.id, client.handshake.session);
    // Join the room for app backend users to receive broadcast events
    if (client.handshake.session && client.handshake.session.isAppBackendRequest && client.handshake.session.isLoggedInToAppBackend) {
      client.join(`${client.handshake.session.lastShop}-app-backend`);
    }
    // Join the room for theme client visitors to receive broadcast events
    if (client.handshake.session && client.handshake.session.isThemeClientRequest) {
      client.join(`${client.handshake.session.lastShop}-client-theme`);
    }
  }

  handleDisconnect(client: SessionSocket) {
    this.logger.debug('disconnect', client.id);
  }
}
