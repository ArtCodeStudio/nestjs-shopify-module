import { Injectable } from '@nestjs/common';
import { Products } from 'shopify-prime'; // https://github.com/nozzlegear/Shopify-Prime

@Injectable()
export class ProductsService extends Products {}
