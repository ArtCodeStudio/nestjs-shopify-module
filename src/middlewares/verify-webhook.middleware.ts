import { Inject, Injectable, NestMiddleware, MiddlewareFunction, Request } from '@nestjs/common';
import { ShopifyAuthService } from '../auth/auth.service';
import { ShopifyConnectService } from '../auth/connect.service';
import { DebugService } from '../debug.service';

import { ShopifyModuleOptions} from '../interfaces/shopify-module-options';
import { SHOPIFY_MODULE_OPTIONS} from '../shopify.constants';
import * as crypto from 'crypto';

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
    return async (req: Request, res, next) => {
      const hmac = req.headers['x-shopify-hmac-sha256'];
      this.logger.debug(`webhook hmac:`, hmac);
      if (hmac) {
        // TODO: Does this work? We want the RAW request body.
        const body = await req.text();
        const digest = crypto.createHmac('sha256', this.shopifyModuleOptions.clientSecret)
          .update(body)
          .digest('base64');
        this.logger.debug(`webhook digest:`, digest);
        if (digest === hmac) {
          return next();
        } else {
          // TODO: How to throw error?
          // return ctx.throw(401, 'SHOPIFY_POLICIES_WEBHOOK_INVALID_HMAC');
        }
      }
    };
  }
}