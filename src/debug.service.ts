import { Logger } from '@nestjs/common';
import { debug, Debugger } from 'debug';

/**
 * TODO use https://github.com/winstonjs/winston / https://github.com/felixge/node-stack-trace?
 */
export class DebugService {
  private namespace: string;
  private debugger: Debugger;
  constructor(namespace: string) {
    this.namespace = namespace;
    this.debugger = debug(this.namespace);
  }

  public log(...args: any[]) {
    Logger.log(
      args
        .map((arg) => {
          if (typeof arg === 'object') {
            return JSON.stringify(arg, null, 2);
          }
          return arg;
        })
        .join(' '),
      this.namespace,
    );
  }

  public debug(formatter: string, ...args: any[]) {
    // this.log(...args);
    this.debugger(formatter, ...args);
  }

  public warn(...args: any[]) {
    Logger.warn(
      args
        .map((arg) => {
          if (typeof arg === 'object') {
            return JSON.stringify(arg, null, 2);
          }
          return arg;
        })
        .join('\n'),
      this.namespace,
    );
  }

  public error(...args: any[]) {
    const msgs = [];
    const traces = [];
    args.forEach((arg) => {
      if (typeof arg === 'object') {
        if (arg instanceof Error) {
          msgs.push(arg.message);
          traces.push(arg.stack);
        } else {
          msgs.push(JSON.stringify(arg, null, 2));
        }
      } else {
        msgs.push(arg);
      }
    });
    let trace = '';
    if (traces.length === 1) {
      trace = traces[0];
    } else if (traces.length > 1) {
      trace = traces.map((t, i) => `[${i + 1}] ${t}`).join('\n');
    }
    Logger.error(msgs.join('\n'), trace, this.namespace);
  }
}
