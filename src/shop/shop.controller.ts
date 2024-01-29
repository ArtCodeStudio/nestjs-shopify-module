import {
  Controller,
  Get,
  HttpStatus,
  HttpException,
  Param,
} from "@nestjs/common";

import { Roles } from "../guards/roles.decorator"; // '../../app.module';

import { ShopService } from "./shop.service";

import { DebugService } from "../debug.service";

@Controller("shopify/shop")
export class ShopController {
  protected logger = new DebugService("shopify:ShopController");

  constructor(private readonly shopService: ShopService) {}

  /**
   * Get a list of all connected shopify accounts
   * @param req
   */
  @Get()
  @Roles("admin")
  connects() {
    return this.shopService.findAll().catch((error: Error) => {
      this.logger.error(error);
      throw new HttpException(
        `Failure on get shops`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    });
  }

  /**
   * Get a connected instagram account by shopify store id
   * @param id
   */
  @Get("/:id")
  @Roles("admin")
  connect(@Param("id") id) {
    return this.shopService
      .findByShopifyID(Number(id))
      .catch((error: Error) => {
        this.logger.error(error);
        throw new HttpException(
          {
            message: `Failure on get shop with id ${id}.`,
            id,
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      });
  }
}
