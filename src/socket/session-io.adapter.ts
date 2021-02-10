import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Socket } from 'socket.io';
import { NextFunction, RequestHandler } from 'express';
import * as sharedsession from 'express-socket.io-session';
import { DebugService } from '../debug.service';

export class SessionIoAdapter extends IoAdapter {

  protected logger = new DebugService(`shopify:${this.constructor.name}`);
  protected socketSessionMiddleware: (
    socket: Socket,
    next: NextFunction,
  ) => void;
  constructor(
    session: RequestHandler,
    appOrHttpServer?: INestApplicationContext | any
  ) {
    super(appOrHttpServer);
    /**
     * Make session available on socket.io client socket object
     * @see https://github.com/oskosk/express-socket.io-session
     */
    this.socketSessionMiddleware = sharedsession(session, {
      autoSave: true,
    });
  }

  public createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.use(this.socketSessionMiddleware);
    return server;
  }
}
