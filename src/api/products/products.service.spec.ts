import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ShopifyConnectService } from '../../auth/connect.service';
import { IShopifyConnect } from '../../auth/interfaces';
import { Models } from 'shopify-prime';

import { ShopifyModule } from '../../shopify.module';
import { config, mongooseConnectionPromise } from '../../../test/config.test';
import * as passport from 'passport';

describe('ProductsService', () => {
  let service: ProductsService;
  let module: TestingModule;
  let shopifyConnectService: ShopifyConnectService;
  let user: IShopifyConnect;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ShopifyModule.forRoot(config, await mongooseConnectionPromise, passport)],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    shopifyConnectService = module.get<ShopifyConnectService>(ShopifyConnectService);

    // user = await shopifyConnectService.findByDomain('jewelberry-dev.myshopify.com')
    user = {
      roles: [
        'shopify-staff-member',
      ],
      shopifyID: 12396948,
      myshopify_domain: 'jewelberry-dev.myshopify.com',
      shop: {
        id: 12396948,
        name: 'jewelberry-dev',
        email: 'pascal@jumplink.eu',
        domain: 'jewelberry-dev.myshopify.com',
        province: null,
        country: 'DE',
        address1: 'Bei der Kirche 12',
        zip: '27476',
        city: 'Cuxhaven',
        source: 'jumplink',
        phone: '+4915756431988',
        latitude: '53.8837',
        longitude: '8.673869999999999',
        primary_locale: 'de',
        address2: null,
        created_at: '2016-04-07T07:40:11-04:00',
        country_code: 'DE',
        country_name: 'Germany',
        currency: 'EUR',
        customer_email: 'pascal@jumplink.eu',
        timezone: '(GMT-05:00) Eastern Time (US & Canada)',
        iana_timezone: 'America/New_York',
        shop_owner: 'Moritz Raguschat',
        money_format: '€{{amount}}',
        money_with_currency_format: '€{{amount}} EUR',
        province_code: null,
        taxes_included: true,
        tax_shipping: null,
        county_taxes: true,
        plan_name: 'affiliate',
        has_discounts: false,
        has_gift_cards: false,
        myshopify_domain: 'jewelberry-dev.myshopify.com',
        google_apps_domain: null,
        google_apps_login_enabled: null,
        password_enabled: true,
        has_storefront: true,
        setup_required: false,
        force_ssl: true,
      },
      accessToken: '958bed3b47a08a7003b385e1551fce24',
      updatedAt: new Date ('2019-01-16T16:21:11.455'),
      createdAt: new Date('2018-11-29T19:43:03.964Z'),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listFromShopify', () => {
    it('should be defined', () => {
      expect(service.listFromShopify).toBeDefined();
    });
  });

  describe('countFromShopify', () => {
    it('should be defined', () => {
      expect(service.countFromShopify).toBeDefined();
    });
  });

  describe('compare list methods', async () => {
    let countFromShopify: number;
    let listFromShopify: Partial<Models.Product>[] = [];

    it('count should be a number', async () => {
      countFromShopify = await service.countFromShopify(user, {});
      expect(typeof(countFromShopify)).toBe('number');
    });

    it('shopifyListResult should have the same length like count', async () => {
      listFromShopify = await service.listFromShopify(user, {});
      expect(listFromShopify.length).toBe(countFromShopify);
    });
  });
});
