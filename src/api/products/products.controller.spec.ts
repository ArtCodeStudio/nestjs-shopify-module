import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('Products Controller', () => {
  let module: TestingModule;
  // let shopifyConnectService: ShopifyConnectService;
  // let productsController: ProductsController;
  // let productsService: ProductsService;
  // let user: IShopifyConnect;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();

    // shopifyConnectService = module.get<ShopifyConnectService>(ShopifyConnectService);
    // productsController = module.get<ProductsController>(ProductsController);
    // productsService = module.get<ProductsService>(ProductsService);

    // user = await shopifyConnectService.findByDomain('jewelberry-dev.myshopify.com');
  });

  it('should be defined', () => {
    const controller: ProductsController = module.get<ProductsController>(ProductsController);
    expect(controller).toBeDefined();
  });

});
