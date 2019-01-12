import { Test, TestingModule } from '@nestjs/testing';
import { CustomCollectionsService } from './custom-collections.service';

describe('CustomCollectionsService', () => {
  let service: CustomCollectionsService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomCollectionsService],
    }).compile();
    service = module.get<CustomCollectionsService>(CustomCollectionsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
