import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyThemeAssetService } from './assets.service';

describe('ShopifyThemeAssetService', () => {
  let service: ShopifyThemeAssetService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopifyThemeAssetService],
    }).compile();
    service = module.get<ShopifyThemeAssetService>(ShopifyThemeAssetService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
