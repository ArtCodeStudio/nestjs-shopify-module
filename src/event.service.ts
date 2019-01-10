import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { DebugService } from 'debug.service';
@Injectable()
export class EventService extends EventEmitter {

  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor() {
    super();

    if (process.env.NODE_ENV === 'development') {
      this.on('sync:order', payload => {
        this.logger.debug(`sync:order`, `${payload.shop}:${payload.id}`, payload.state);
      });

      this.on('sync:product', payload => {
        this.logger.debug(`sync:product`, `${payload.shop}:${payload.id}`, payload.state);
      });

      this.on('sync', payload => {
        this.logger.debug(`sync`, `${payload.shop}:${payload.id}`, payload.state);
      });
    }
  }
}
