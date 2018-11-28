import { Injectable } from '@nestjs/common';
import { Orders } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime

@Injectable()
export class OrdersService extends Orders{
}
