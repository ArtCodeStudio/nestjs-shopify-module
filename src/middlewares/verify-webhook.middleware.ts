import { Inject, Injectable, NestMiddleware, MiddlewareFunction, Request } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';

import { ShopifyModuleOptions} from '../interfaces/shopify-module-options';
import { SHOPIFY_MODULE_OPTIONS} from '../shopify.constants';
import { isAuthenticWebhook } from 'shopify-prime/auth';
import * as crypto from 'crypto';
import * as concat from 'concat-stream';

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
    return async (req, res, next) => {
      this.logger.debug('verifyWebhook middleware');
      this.logger.debug('req.headers', req.headers);
      const hmac = req.headers['x-shopify-hmac-sha256'];
      let rawBody;

      this.logger.debug('verifyWebhook middleware hmac', hmac);
      req.pipe(concat(data => {
        rawBody = data;

        this.logger.debug(`webhook rawBody:`, rawBody);
        try {
          req.body = JSON.parse(rawBody);
          this.logger.debug(`webhook parsed body:`, rawBody);
        } catch (e) {
          req.body = {};
          this.logger.debug(`webhook failed parsing body`);
        }
        if (hmac) {
          if (isAuthenticWebhook(req.headers, rawBody, this.shopifyModuleOptions.clientSecret)) {
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
            this.logger.debug('invalid webhook hmac:', hmac, req.body);
            res.status(401).send({ error: 'INVALID HMAC' });
            // TODO: How to throw error?
            // return ctx.throw(401, 'SHOPIFY_POLICIES_WEBHOOK_INVALID_HMAC');
          }
        }
      }));
    };
  }
}