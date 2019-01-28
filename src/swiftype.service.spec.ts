import { Test, TestingModule } from '@nestjs/testing';
import { SwiftypeService } from './swiftype.service';

describe('SwiftypeService', () => {
  let service: SwiftypeService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwiftypeService],
    }).compile();
    service = module.get<SwiftypeService>(SwiftypeService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
