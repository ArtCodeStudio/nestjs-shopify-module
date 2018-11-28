import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyThemeService } from './theme.service';

describe('ShopifyThemeService', () => {
  let service: ShopifyThemeService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopifyThemeService],
    }).compile();
    service = module.get<ShopifyThemeService>(ShopifyThemeService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
