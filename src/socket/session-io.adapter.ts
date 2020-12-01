import { INestApplicationContext } from '@nestjs/common';
import { Server } from 'http';
import * as express from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as sharedsession from 'express-socket.io-session';
import { Socket } from 'socket.io';
import { NextFunction } from 'express';

/**
 * @see https://github.com/nestjs/nest/blob/master/packages/websockets/adapters/io-adapter.ts
 */
export class SessionIoAdapter extends IoAdapter {

  protected socketSessionMiddleware: (socket: Socket, next: NextFunction) => void;

  constructor(session: express.RequestHandler, host: string, appOrHttpServer: INestApplicationContext | Server) {
    super(appOrHttpServer);

    /**
     * Make session available on socket.io client socket object
     * @see https://github.com/oskosk/express-socket.io-session
     */
    this.socketSessionMiddleware = sharedsession(session, {
      autoSave: true,
    });
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);

    // Sharing session data with a namespaced socket // TODO NEST7 CHECKME
    server.of('/socket.io/shopify/api/products').use(this.socketSessionMiddleware);
    server.of('/socket.io/shopify/api/webhooks').use(this.socketSessionMiddleware);
    server.of('/socket.io/shopify/sync').use(this.socketSessionMiddleware);

    // TODO move to Gateway and nest-shopify?
    // this.bindMiddleware(server.of('/socket.io/shopify/api/products'), this.socketSessionMiddleware);
    // this.bindMiddleware(server.of('/socket.io/shopify/api/webhooks'), this.socketSessionMiddleware);
    // this.bindMiddleware(server.of('/socket.io/shopify/sync'), this.socketSessionMiddleware);
    return server;
  }
}