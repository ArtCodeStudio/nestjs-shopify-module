import { INestApplicationContext } from '@nestjs/common';
import { Server as HttpServer } from 'http';
import * as express from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as sharedsession from 'express-socket.io-session';
import { Socket, Server } from 'socket.io';
import { NextFunction } from 'express';
import { DebugService } from '../debug.service';

/**
 * @see https://github.com/nestjs/nest/blob/master/packages/platform-socket.io/adapters/io-adapter.ts
 * @see https://github.com/nestjs/nest/blob/master/packages/websockets/adapters/ws-adapter.ts
 */
export class SessionIoAdapter extends IoAdapter {

  protected logger = new DebugService('shopify:SessionIoAdapter');

  protected socketSessionMiddleware: (socket: Socket, next: NextFunction) => void;

  constructor(session: express.RequestHandler, appOrHttpServer: INestApplicationContext | HttpServer) {
    super(appOrHttpServer);

    /**
     * Make session available on socket.io client socket object
     * @see https://github.com/oskosk/express-socket.io-session
     */
    this.socketSessionMiddleware = sharedsession(session, {
      autoSave: true,
    });
  }

  createIOServer(port: number, options?: any) {

    this.logger.debug('createIOServer', port, options)

    const server: Server = super.createIOServer(port, options);

    // Sharing session data with a namespaced socket // TODO NEST7 CHECKME
    server.use(this.socketSessionMiddleware); 
    // server.of('/socket.io/shopify/api/products').use(this.socketSessionMiddleware);
    // server.of('/socket.io/shopify/api/webhooks').use(this.socketSessionMiddleware);
    // server.of('/socket.io/shopify/sync').use(this.socketSessionMiddleware);

    // TODO move to Gateway and nest-shopify?
    // this.bindMiddleware(server.of('/socket.io/shopify/api/products'), this.socketSessionMiddleware);
    // this.bindMiddleware(server.of('/socket.io/shopify/api/webhooks'), this.socketSessionMiddleware);
    // this.bindMiddleware(server.of('/socket.io/shopify/sync'), this.socketSessionMiddleware);
    return server;
  }
}