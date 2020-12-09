import { INestApplicationContext } from '@nestjs/common';
import { Server as HttpServer } from 'http';
import * as express from 'express';
import Redis from 'ioredis';
import redisAdapter = require('socket.io-redis');
import { Socket, Server } from 'socket.io';
import { NextFunction } from 'express';
import { SessionIoAdapter } from './session-io.adapter';
import { DebugService } from '../debug.service';

/**
 * @see https://github.com/nestjs/nest/blob/master/packages/platform-socket.io/adapters/io-adapter.ts
 * @see https://github.com/nestjs/nest/blob/master/packages/websockets/adapters/ws-adapter.ts
 */
export class RedisSessionIoAdapter extends SessionIoAdapter {

  protected logger = new DebugService('shopify:SessionIoAdapter');

  protected socketSessionMiddleware: (socket: Socket, next: NextFunction) => void;

  protected redisAdapter: typeof redisAdapter;

  constructor(session: express.RequestHandler, redisUrl: string, host: string, appOrHttpServer: INestApplicationContext | HttpServer) {
    super(session, appOrHttpServer);

    const pub = new Redis(redisUrl, { keyPrefix: host });
    const sub = new Redis(redisUrl, { keyPrefix: host });

    /**
     * Use socket.io with redis
     * By running socket.io with the socket.io-redis adapter you can
     * run multiple socket.io instances in different processes
     * or servers that can all broadcast and emit events to and from each other.
     * @see https://github.com/socketio/socket.io-redis
     */
    this.redisAdapter = redisAdapter({ pubClient: pub, subClient: sub });
  }

  createIOServer(port: number, options?: any) {
    const server: Server = super.createIOServer(port, options);
    server.adapter(this.redisAdapter);
    return server;
  }
}