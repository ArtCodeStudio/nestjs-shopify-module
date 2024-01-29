import {
  Controller,
  UseGuards,
  Req,
  Get,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { AccessScopesService } from "./access-scopes.service";
import { DebugService } from "../../debug.service";

import { ShopifyApiGuard } from "../../guards/shopify-api.guard";
import { Roles } from "../../guards/roles.decorator";

// Interfaces
import { IUserRequest } from "../../interfaces/user-request";

@Controller("shopify/api/access-scopes")
export class AccessScopesController {
  constructor(protected readonly accessScopesService: AccessScopesService) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles("shopify-staff-member")
  @Get()
  async listFromShopify(@Req() req: IUserRequest) {
    try {
      return await this.accessScopesService.listFromShopify(
        req.session[`shopify-connect-${req.shop}`]
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
