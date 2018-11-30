import { LoggerService, Logger } from '@nestjs/common';
import Debug from 'debug';
export declare class DebugService extends Logger implements LoggerService {
    debug: Debug.IDebugger;
    constructor(name: string);
}
