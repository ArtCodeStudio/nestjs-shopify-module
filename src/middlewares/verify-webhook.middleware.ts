import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { DebugService } from "../debug.service";

import { ShopifyModuleOptions } from "../interfaces/shopify-module-options";
import { SHOPIFY_MODULE_OPTIONS } from "../shopify.constants";
import { Auth } from "shopify-admin-api";
import concat = require("concat-stream");
import { IUserRequest } from "../interfaces/user-request";
import { Response, NextFunction } from "express";

@Injectable()
export class VerifyWebhookMiddleware implements NestMiddleware {
  logger = new DebugService(`shopify:${this.constructor.name}`);
  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS)
    private readonly shopifyModuleOptions: ShopifyModuleOptions
  ) {}
  async use(req: IUserRequest, res: Response, next: NextFunction) {
    this.logger.debug("verifyWebhook middleware");
    this.logger.debug("req.headers", req.headers);
    const hmac = req.headers["x-shopify-hmac-sha256"];
    let rawBody: any;

    this.logger.debug("verifyWebhook middleware hmac", hmac);
    req.pipe(
      concat((data) => {
        rawBody = data;

        // this.logger.debug(`webhook rawBody:`, rawBody);
        try {
          req.body = JSON.parse(rawBody);
          // this.logger.debug(`webhook parsed body:`, rawBody);
        } catch (e) {
          req.body = {};
          this.logger.error(`webhook failed parsing body: ${rawBody}`);
          return res
            .status(e.statusCode || 415)
            .send({ error: "INVALID JSON" });
        }
        if (hmac) {
          if (
            Auth.isAuthenticWebhook(
              req.headers,
              rawBody,
              this.shopifyModuleOptions.shopify.clientSecret
            )
          ) {
            return next();
          } else {
            this.logger.error(`invalid webhook hmac: ${hmac}`);
            return res.status(403).send({ error: "INVALID HMAC" });
            // TODO: How to throw error?
            // return ctx.throw(401, 'SHOPIFY_POLICIES_WEBHOOK_INVALID_HMAC');
          }
        }
      })
    );
  }
}
