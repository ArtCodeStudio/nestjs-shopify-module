import { UseGuards, Controller, Post, Get, Req, Body, Query, Headers, Param, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { ShopifyApiGuard } from '../guards/shopify-api.guard';
import { Roles } from '../guards/roles.decorator';
import { IUserRequest } from '../interfaces/user-request';
import { WebhooksService } from './webhooks.service';
import { EventService } from '../event.service';
import { DebugService } from '../debug.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    protected readonly webhooksService: WebhooksService,
    protected readonly eventService: EventService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);

  @UseGuards(ShopifyApiGuard)
  @Roles('admin')
  @Get('')
  async listAllFromShopify(@Req() req: IUserRequest) {
    const webhooks = await this.webhooksService.list(req.session[`shopify-connect-${req.shop}`]);
    this.logger.debug(`webhooks`, webhooks);
    return webhooks;
  }


  /**
   * Create a webhook
   */
  @UseGuards(ShopifyApiGuard)
  @Roles()
  @Get('create')
  async createWebhook(
    @Req() req: IUserRequest,
    @Query('topic') topic,
  ) {
    try {
      const result = await this.webhooksService.create(req.session[`shopify-connect-${req.shop}`], topic);
      this.logger.debug(`Create webhook result`, result);
      return result;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Catch-all method for all webhooks of the form topic = :resource/:event, i.e. orders/updated
   */
  @Post('/:resource/:event')
  @HttpCode(200)
  async catchWebhook(
    @Headers('X-Shopify-Shop-Domain') myShopifyDomain: string,
    @Headers('X-Shopify-Hmac-Sha256') hmac: string,
    @Headers('X-Shopify-API-Version') apiVersion: string,
    @Headers('X-Shopify-Topic') topic: string,
    @Param('resource') resource: string,
    @Param('event') event: string,
    @Body() body: any,
  ) {
    try {
      // const topic = `${resource}/${event}`;
      this.logger.debug(`[${myShopifyDomain}] Webhook ${topic}`, body);
      this.eventService.emit(`webhook:${topic}`, myShopifyDomain, body);
      this.eventService.emit(`webhook:${myShopifyDomain}:${topic}`, body);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
