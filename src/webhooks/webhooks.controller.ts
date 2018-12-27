import { Controller, Post, Get, Req, Request, Res, Body, Query } from '@nestjs/common';
import { IUserRequest } from '../interfaces/user-request';
import { WebhooksService } from './webhooks.service';
import { DebugService } from '../debug.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    protected readonly webhooksService: WebhooksService
  ) {};
  logger = new DebugService(`shopify:${this.constructor.name}`);


  @Post('orders/updated')
  async ordersUpdated(@Req() req: Request, @Res() res, @Body() body) {
    this.logger.debug(`Webhook 'orders/updated'`, body);
  }
  @Get('create')
  async createWebhook(@Req() req: IUserRequest, @Res() res, @Query('topic') topic) {
    const result = await this.webhooksService.create(req.shopifyConnect, topic);
    this.logger.debug(`Create webhook result`, result);
    res.jsonp(result);
  }
}
