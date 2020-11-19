import { INestApplicationContext } from '@nestjs/common';
import { Server } from 'http';
import * as express from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io';
// import * as Redis from 'redis';
import Redis from 'ioredis';
import { RedisAdapter } from 'socket.io-redis';
import * as sharedsession from 'express-socket.io-session';
import { Socket } from 'socket.io';
import { NextFunction } from 'express';

/**
 * @see https://github.com/nestjs/nest/blob/master/packages/websockets/adapters/io-adapter.ts
 */
export class RedisSessionIoAdapter extends IoAdapter {

  protected socketSessionMiddleware: (socket: Socket, next: NextFunction) => void;

  protected redisAdapter: RedisAdapter;

  constructor(session: express.RequestHandler, redisUrl: string, host: string, appOrHttpServer: INestApplicationContext | Server) {
    super(appOrHttpServer);

    const pub = new Redis(redisUrl, { keyPrefix: host });
    const sub = new Redis(redisUrl, { keyPrefix: host });

    /**
     * Use socket.io with redis
     * By running socket.io with the socket.io-redis adapter you can
     * run multiple socket.io instances in different processes
     * or servers that can all broadcast and emit events to and from each other.
     * @see https://github.com/socketio/socket.io-redis
     */
    this.redisAdapter = new RedisAdapter(host, redisUrl, { pubClient: pub, subClient: sub });

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
    server.adapter(this.redisAdapter);

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