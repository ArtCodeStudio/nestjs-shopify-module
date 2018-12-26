import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class EventService extends EventEmitter {

  constructor() {
    super();
  }
}
