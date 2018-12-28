import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { DebugService } from '../debug.service';

@Injectable()
export class GetUserMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor() {

  }
  async resolve(...args: any[]): Promise<MiddlewareFunction> {
    return async (req, res, next) => {
      // WORAROUND for oAuthCallback.oAuthConnect wich stores the user in the session
      if (req.session && req.session.user) {
        req.user = req.session.user;
      }
      return next();
    };
  }
}