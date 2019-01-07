import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { Observable, of } from 'rxjs';
import { SessionSocket } from '../../interfaces/session-socket';
import { ProductsService, ProductListOptions, ProductCountOptions } from './products.service';
import { Product, ProductUpdateCreate } from 'shopify-prime/models';

@WebSocketGateway({path: '/api/products'})
export class ProductsGateway {

  constructor(
    protected readonly productsService: ProductsService
  ){}

  @SubscribeMessage('all')
  onEvent(client: SessionSocket, options: ProductListOptions = {}): Observable<WsResponse<Product>> {
    return this.productsService.listAllFromShopifyObservable(client.handshake.session.shopifyConnect, 'all', options);
  }
}
