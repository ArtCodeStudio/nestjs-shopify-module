import { INestApplicationContext } from '@nestjs/common';
import { Server } from 'http';
import * as express from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io';
// import * as Redis from 'redis';
import Redis from 'ioredis';
import { RedisAdapter, createAdapter } from 'socket.io-redis';
import * as sharedsession from 'express-socket.io-session';
import { Socket } from 'socket.io';
import { NextFunction } from 'express';
import { SessionIoAdapter } from './session-io.adapter';

/**
 * @see https://github.com/nestjs/nest/blob/master/packages/websockets/adapters/io-adapter.ts
 */
export class RedisSessionIoAdapter extends SessionIoAdapter {

  protected socketSessionMiddleware: (socket: Socket, next: NextFunction) => void;

  protected redisAdapter: RedisAdapter;

  constructor(session: express.RequestHandler, redisUrl: string, host: string, appOrHttpServer: INestApplicationContext | Server) {
    super(session, host, appOrHttpServer);

    const pub = new Redis(redisUrl, { keyPrefix: host });
    const sub = new Redis(redisUrl, { keyPrefix: host });

    /**
     * Use socket.io with redis
     * By running socket.io with the socket.io-redis adapter you can
     * run multiple socket.io instances in different processes
     * or servers that can all broadcast and emit events to and from each other.
     * @see https://github.com/socketio/socket.io-redis
     */
    this.redisAdapter = createAdapter({ pubClient: pub, subClient: sub });

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
    return server;
  }
}