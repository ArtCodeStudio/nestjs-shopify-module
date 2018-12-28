import { Controller, Post, Get, Req, Res, Body, Query, Headers, Param } from '@nestjs/common';
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
  ) {};
  logger = new DebugService(`shopify:${this.constructor.name}`);

  /**
   * Create a webhook
   */
  @Get('create')
  async createWebhook(
    @Req() req: IUserRequest,
    @Res() res: Response,
    @Query('topic') topic,
  ) {
    const result = await this.webhooksService.create(req.shopifyConnect, topic);
    this.logger.debug(`Create webhook result`, result);
    return res.jsonp(result);
  }

  /**
   * Catch-all method for all webhooks of the form topic = :resource/:event, i.e. orders/updated
   */
  @Post(':resource/:event')
  async catchWebhook(
    @Res() res: Response,
    @Headers('x-shopify-shop-domain') myShopifyDomain: string,
    @Param('resource') resource: string,
    @Param('event') event: string,
    @Body() body: any
  ) {
    const topic = `${resource}/${event}`
    this.logger.debug(`Webhook ${topic}`, body);
    res.sendStatus(200);
    this.eventService.emit(`webhook:${topic}`, myShopifyDomain, body);
    this.eventService.emit(`webhook:${myShopifyDomain}:${topic}`, body);
  }
}
