import { UseGuards, Controller, Post, Get, Req, Res, Body, Query, Headers, Param, HttpStatus } from '@nestjs/common';
import { ShopifyApiGuard } from '../guards/shopify-api.guard';
import { Roles } from '../guards/roles.decorator';
import { Request, Response } from 'express';
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
  async listAllFromShopify(@Req() req: IUserRequest, @Res() res: Response) {
    const webhooks = await this.webhooksService.list(req.shopifyConnect);
    this.logger.debug(`webhooks`, webhooks);
    return res.jsonp(webhooks);
  }


  /**
   * Create a webhook
   */
  @UseGuards(ShopifyApiGuard)
  @Roles()
  @Get('create')
  async createWebhook(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query('topic') topic,
  ) {
    try {
      const result = await this.webhooksService.create(req.shopifyConnect, topic);
      this.logger.debug(`Create webhook result`, result);
      return res.jsonp(result);
    } catch (error) {
      this.logger.error(error);
      return res.status(error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  /**
   * Catch-all method for all webhooks of the form topic = :resource/:event, i.e. orders/updated
   */
  @Post('/:resource/:event')
  async catchWebhook(
    @Res() res: Response,
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
      console.debug(`[${myShopifyDomain}] Webhook ${topic}`, body);
      this.logger.debug(`[${myShopifyDomain}] Webhook ${topic}`, body);
      this.eventService.emit(`webhook:${topic}`, myShopifyDomain, body);
      this.eventService.emit(`webhook:${myShopifyDomain}:${topic}`, body);
      return res.sendStatus(200);
    } catch (error) {
      this.logger.error(error);
      return res.status(error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
