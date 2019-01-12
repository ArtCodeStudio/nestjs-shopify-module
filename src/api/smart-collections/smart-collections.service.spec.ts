import { Test, TestingModule } from '@nestjs/testing';
import { SmartCollectionsService } from './smart-collections.service';

describe('SmartCollectionsService', () => {
  let service: SmartCollectionsService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmartCollectionsService],
    }).compile();
    service = module.get<SmartCollectionsService>(SmartCollectionsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
