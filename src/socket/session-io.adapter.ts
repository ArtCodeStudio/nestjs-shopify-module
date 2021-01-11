import { NestApplication } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { isFunction, isNil } from '@nestjs/common/utils/shared.utils';
import {
  AbstractWsAdapter,
  MessageMappingProperties,
} from '@nestjs/websockets';
import { DISCONNECT_EVENT } from '@nestjs/websockets/constants';
import { fromEvent, Observable } from 'rxjs';
import { filter, first, map, mergeMap, share, takeUntil } from 'rxjs/operators';
import { Socket, Server } from 'socket.io';
import { NextFunction, RequestHandler } from 'express';
import { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as sharedsession from 'express-socket.io-session';
import { DebugService } from '../debug.service';

// TODO: Using this until socket.io v3 is part of Nest.js, see: https://github.com/nestjs/nest/issues/5676
export class SessionIoAdapter extends AbstractWsAdapter {

  protected logger = new DebugService(`shopify:${this.constructor.name}`);
  protected socketSessionMiddleware: (
    socket: Socket,
    next: NextFunction,
  ) => void;
  constructor(
    session: RequestHandler,
    appOrHttpServer?: INestApplicationContext | any,
    private corsOrigin?:
      | boolean
      | string
      | RegExp
      | (string | RegExp)[]
      | CustomOrigin,
  ) {
    super(appOrHttpServer.getHttpServer());
    /**
     * Make session available on socket.io client socket object
     * @see https://github.com/oskosk/express-socket.io-session
     */
    this.socketSessionMiddleware = sharedsession(session, {
      autoSave: true,
    });
  }

  public create(
    port: number,
    options?: any & { namespace?: string; server?: any },
  ): any {
    if (!options) {
      return this.createIOServer(port);
    }
    const { namespace, server, ...opt } = options;
    if (server && isFunction(server.of)) {
      if (server.of.namespace) {
        return this.createIOServer(port, opt).of(namespace);
      } else {
        return this.createIOServer(port, opt);
      }
    } else {
      if (namespace) {
        return this.createIOServer(port, opt).of(namespace);
      } else {
        return this.createIOServer(port, opt);
      }
    }
  }

  public createIOServer(port: number, options?: any): any {
    let server;
    if (this.httpServer && port === 0) {
      server = new Server(this.httpServer, {
        cors: {
          origin: this.corsOrigin,
          methods: ['GET', 'POST'],
          credentials: true,
        },
        cookie: {
          httpOnly: true,
          path: '/',
        },
        // Allow 1MB of data per request.
        maxHttpBufferSize: 1e6,
      });
    } else {
      server = new Server(port, options);
    }
    server.use(this.socketSessionMiddleware);
    return server;
  }

  public bindMessageHandlers(
    client: any,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ) {
    const disconnect$ = fromEvent(client, DISCONNECT_EVENT).pipe(
      share(),
      first(),
    );

    handlers.forEach(({ message, callback }) => {
      const source$ = fromEvent(client, message).pipe(
        mergeMap((payload: any) => {
          const { data, ack } = this.mapPayload(payload);
          return transform(callback(data, ack)).pipe(
            filter((response: any) => !isNil(response)),
            map((response: any) => [response, ack]),
          );
        }),
        takeUntil(disconnect$),
      );
      source$.subscribe(([response, ack]) => {
        if (response.event) {
          return client.emit(response.event, response.data);
        }
        isFunction(ack) && ack(response);
      });
    });
  }

  public mapPayload(payload: any): { data: any; ack?: () => any } {
    if (!Array.isArray(payload)) {
      return { data: payload };
    }
    const lastElement = payload[payload.length - 1];
    const isAck = isFunction(lastElement);
    if (isAck) {
      const size = payload.length - 1;
      return {
        data: size === 1 ? payload[0] : payload.slice(0, size),
        ack: lastElement,
      };
    }
    return { data: payload };
  }
}
