import { Controller, Post, Get, Req, Res, Body, Query } from '@nestjs/common';
import { Request, Response } from 'express';
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
  async ordersUpdated(@Req() req: Request, @Res() res: Response, @Body() body) {
    this.logger.debug(`Webhook 'orders/updated'`, body);
    res.sendStatus(200);
  }
  @Get('create')
  async createWebhook(@Req() req: IUserRequest, @Res() res: Response, @Query('topic') topic) {
    const result = await this.webhooksService.create(req.shopifyConnect, topic);
    this.logger.debug(`Create webhook result`, result);
    return res.jsonp(result);
  }
}
