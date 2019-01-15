import { Inject, Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';

import { ShopifyModuleOptions} from '../interfaces/shopify-module-options';
import { SHOPIFY_MODULE_OPTIONS} from '../shopify.constants';
import { isAuthenticWebhook } from 'shopify-prime/auth';
import * as concat from 'concat-stream';
import { IUserRequest } from '../interfaces/user-request';
import { Response, NextFunction } from 'express';

@Injectable()
export class VerifyWebhookMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions,
    private readonly shopifyAuthService: ShopifyAuthService,
    private readonly shopifyConnectService: ShopifyConnectService,
  ) {

  }
  async resolve(...args: any[]): Promise<MiddlewareFunction> {
    return async (req: IUserRequest, res: Response, next: NextFunction) => {
      this.logger.debug('verifyWebhook middleware');
      this.logger.debug('req.headers', req.headers);
      const hmac = req.headers['x-shopify-hmac-sha256'];
      let rawBody;

      this.logger.debug('verifyWebhook middleware hmac', hmac);
      req.pipe(concat(data => {
        rawBody = data;

        // this.logger.debug(`webhook rawBody:`, rawBody);
        try {
          req.body = JSON.parse(rawBody);
          // this.logger.debug(`webhook parsed body:`, rawBody);
        } catch (e) {
          req.body = {};
          this.logger.error(`webhook failed parsing body: ${rawBody}`);
          res.status(415).send({ error: 'INVALID JSON'})
        }
        if (hmac) {
          if (isAuthenticWebhook(req.headers, rawBody, this.shopifyModuleOptions.shopify.clientSecret)) {
            return next();
          /*
          // TODO: Does this work? We want the RAW request body.
          const body = await req.text();
          const digest = crypto.createHmac('sha256', this.shopifyModuleOptions.clientSecret)
            .update(body)
            .digest('base64');
          this.logger.debug(`webhook digest:`, digest);
          if (digest === hmac) {
            return next();
          */
          } else {
            this.logger.error(`invalid webhook hmac: ${hmac}`);
            res.status(403).send({ error: 'INVALID HMAC' });
            // TODO: How to throw error?
            // return ctx.throw(401, 'SHOPIFY_POLICIES_WEBHOOK_INVALID_HMAC');
          }
        }
      }));
    };
  }
}