import { Controller, Get, Res, Req, HttpStatus, Param } from '@nestjs/common';

import { Roles } from '../guards/roles.decorator'; // '../../app.module';

import { IShopifyShop } from './interfaces/shop';
import { ShopService } from './shop.service';

import { DebugService } from '../../debug.service';

@Controller('shopify/shop')
export class ShopController {

  protected logger = new DebugService('shopify:ShopController');

  constructor(private readonly shopService: ShopService) {

  }

  /**
   * Get a list of all connected shopify accounts
   * @param res
   * @param req
   */
  @Get()
  @Roles('admin')
  connects(@Res() res, @Req() req) {
    return this.shopService.findAll()
    .then((connects: IShopifyShop[]) => {
      return res.json(connects);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Failure on get shops`,
      });
    });
  }

  /**
   * Get a connected instagram account by shopify store id
   * @param res
   * @param req
   */
  @Get('/:id')
  @Roles('admin')
  connect(@Param('id') id, @Res() res, @Req() req) {
    return this.shopService.findByShopifyID(Number(id))
    .then((connect: IShopifyShop) => {
      return res.json(connect);
    })
    .catch((error: Error) => {
      this.logger.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Failure on get shop with id ${id}.`,
        id,
      });
    });
  }
}
