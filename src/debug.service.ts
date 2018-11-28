import { LoggerService, Logger } from '@nestjs/common';
import Debug from 'debug';

export class DebugService extends Logger implements LoggerService {

  public debug: Debug.IDebugger;

  constructor(name: string) {
    super(name);
    this.debug = Debug(`${name}`);
  }
}
