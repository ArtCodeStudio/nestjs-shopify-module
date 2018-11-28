import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyLocalesService } from './shopify-locales.service';

describe('ShopifyLocalesService', () => {
  let service: ShopifyLocalesService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopifyLocalesService],
    }).compile();
    service = module.get<ShopifyLocalesService>(ShopifyLocalesService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
