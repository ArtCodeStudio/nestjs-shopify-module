import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ProductsController } from '../../../../src/api/products/products.controller';
import { ProductsService } from '../../../../src/api/products/products.service';
import { ShopifyConnectService } from '../../../../src/auth/connect.service';
import { IShopifyConnect } from '../../../../src/auth/interfaces';

// import { ShopifyModule } from '../../../../src/shopify.module';
// import { config, mongooseConnectionPromise } from '../../../../test/config.test';
// import * as passport from 'passport';

describe('Products Controller', () => {
  let app: INestApplication;
  let module: TestingModule;
  let shopifyConnectService: ShopifyConnectService;
  let productsService: ProductsService;
  let user: IShopifyConnect;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [ShopifyConnectService, ProductsService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    shopifyConnectService = module.get<ShopifyConnectService>(ShopifyConnectService);
    productsService = module.get<ProductsService>(ProductsService);

    user = await shopifyConnectService.findByDomain('jewelberry-dev.myshopify.com');
  });

  it('should be defined', () => {
    const controller: ProductsController = module.get<ProductsController>(ProductsController);
    expect(controller).toBeDefined();
  });

  it('GET /shopify/api/products', () => {
    it('should return an array of products', async () => {

      return request(app.getHttpServer())
      .get('/shopify/api/products')
      .expect(200)
      .expect({
        data: await productsService.listFromShopify(user),
      });
    });
  });
});
