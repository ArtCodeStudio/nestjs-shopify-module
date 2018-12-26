import { Controller, Post, Req, Request, Res, Body } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {

  @Post('orders/updated')
  async ordersUpdated(@Req() req: Request, @Res() res, @Body() body) {
    console.log(body);
  }
}
