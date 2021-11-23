import { EventEmitter } from 'events';
import { DebugService } from './debug.service';

export class EventService extends EventEmitter {
  logger = new DebugService(`shopify:${this.constructor.name}`);

  constructor() {
    super();

    if (process.env.NODE_ENV === 'development') {
      ['', 'success', 'failed', 'cancelled', 'ended'].forEach((key) => {
        this.on(`${key ? key + ':' : ''}sync`, (shop, progress) => {
          this.logger.debug(
            `${key ? key + ':' : ''}sync: %s %s`,
            `${shop}:${progress.id}`,
            progress.shop,
          );
        });
      });
    }
  }
}
