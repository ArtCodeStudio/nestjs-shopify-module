import { Inject, Controller, Param, Get, Req, Res, Session, HttpStatus, Query} from '@nestjs/common';
import { ChargeService } from './charge.service';
import { DebugService } from '../debug.service';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { Roles } from '../guards/roles.decorator';
import { Models } from 'shopify-prime';
import { ShopifyModuleOptions } from '../interfaces/shopify-module-options';
import { SHOPIFY_MODULE_OPTIONS } from '../shopify.constants';

@Controller('shopify/charge')
export class ChargeController {

  protected debug = new DebugService('ChargeController').debug;

  constructor(
    @Inject(SHOPIFY_MODULE_OPTIONS) private readonly shopifyModuleOptions: ShopifyModuleOptions,
    private readonly chargeService: ChargeService
  ){}

  /**
   * Get a list of all created charges whether accepted or not
   * @param chargeId The charge id
   * @param req
   * @param res
   */
  @Get()
  @Roles('shopify-staff-member')
  async list(@Req() req, @Res() res, @Session() session ) {
    const user = req.user as IShopifyConnect;
    return this.chargeService.listCharges(user)
    .then((charges) => {
      this.debug('charges', charges);
      return res.jsonp(charges);
    })
    .catch((error) => {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({message: error});
    });
  }

  /**
   * Get the current active charge or null if no active charge is found.
   */
  @Get('/active')
  @Roles('shopify-staff-member')
  async active(@Req() req, @Res() res, @Session() session ) {
    const user = req.user as IShopifyConnect;
    return this.chargeService.active(user)
    .then((charge: Models.RecurringCharge | null) => {
      this.debug('charge', charge);
      return res.jsonp(charge);
    })
    .catch((error) => {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({message: error});
    });
  }

  /**
   * Get the current active charge or null if no active charge is found.
   */
  @Get('/available')
  @Roles('shopify-staff-member')
  async available(@Req() req, @Res() res, @Session() session ) {
    const user = req.user as IShopifyConnect;
    return this.chargeService.available(user)
    .then((plans) => {
      this.debug('available plans', plans);
      return res.jsonp(plans);
    })
    .catch((error) => {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).jsonp({message: 'Error on available charges', error});
    });
  }

  /**
   * Activates an accepted charge, this controller is also used for the confirmation_url callback.
   * @param chargeId The charge id
   * @param req
   * @param res
   */
  @Get('/activate')
  @Roles('shopify-staff-member')
  async activate(@Query('charge_id') chargeId, @Req() req, @Res() res) {
    this.debug('activate', chargeId);
    const user = req.user as IShopifyConnect;
    return this.chargeService.getChargeById(user, chargeId)
    .then(async (charge: Models.RecurringCharge) => {
      if (charge.status === 'accepted') {
        return this.chargeService.activate(user, charge.id)
        .then((result) => {
          charge.status = 'active';
          this.debug('result', result);
          // return res.jsonp(charge);
          return res.redirect(this.shopifyModuleOptions.charges.frontend_return_url);
        });
      } else {
        // return res.jsonp(charge);
        return res.redirect(this.shopifyModuleOptions.charges.frontend_return_url);
      }
    })
    .catch((error) => {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: 'Error on activate charge', error});
    });
  }

  /**
   * Create a new plan by name (searched by name in the ConfigService), redirects to shopify and asks the user if he accepts the plan
   * @param name The name of the plan
   * @param req
   * @param res
   */
  @Get('/create/:name')
  @Roles('shopify-staff-member')
  async create(@Param('name') name: string, @Req() req, @Res() res) {
    this.debug('req.user', req.user);
    const user = req.user as IShopifyConnect;
    // this.debug('session.user', session.user);
    return this.chargeService.createByName(user, name)
    .then((charge) => {
      this.debug('charge', charge);
      if (charge) {
        return res.redirect(charge.confirmation_url);
      } else {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: 'No charge returned!'});
      }
    })
    .catch((error) => {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: 'Error on create charge', error});
    });
  }

}
