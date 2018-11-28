import { Controller, Param, Query, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';

import { Roles } from 'shopify/guards/roles.decorator';
import { DebugService } from 'debug.service';
import { ShopifyThemeService } from 'shopify/api/theme/theme.service';
import { ShopifyApiGuard } from 'shopify/guards/shopify-api.guard';

@Controller('api')
export class ApiController {

  constructor() {

  }

  protected logger = new DebugService('shopify:ApiController');

}
