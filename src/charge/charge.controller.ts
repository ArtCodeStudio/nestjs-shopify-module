import { Inject, Controller, Param, Get, Req, Res, Session, HttpStatus, Query} from '@nestjs/common';
import { ChargeService } from './charge.service';
import { DebugService } from '../debug.service';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { Roles } from '../guards/roles.decorator';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { SHOPIFY_MODULE_OPTIONS } from '../shopify.constants';

@Controller('shopify/charge')
export class ChargeController {
  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions
  ){}

  protected debug = new DebugService('ChargeController').debug;

  @Get('/:name')
  @Roles('shopify-staff-member')
  activate(@Param('name') name: string, @Req() req, @Res() res, @Session() session ) {
    this.debug('req.user', req.user);
    const user = req.user as IShopifyConnect;
    // this.debug('session.user', session.user);
    const chargeService = new ChargeService(user.myshopify_domain, user.accessToken, this.shopifyModuleOptions );
    return chargeService.createByName(name)
    .then((charge) => {
      this.debug('charge', charge);
      return res.redirect(charge.confirmation_url);
    })
    .catch((error) => {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: error});
    });
  }

  @Get('/callback')
  @Roles('shopify-staff-member')
  callback(@Query('charge_id') chargeId, @Req() req, @Res() res) {
    this.debug('callback', chargeId);
    return res.send('ok');
    // return chargeService.activate(chargeId)
    // .then((result) => {
    //   this.debug('result', result);
    //   res.send('ok');
    // });
  }
}
