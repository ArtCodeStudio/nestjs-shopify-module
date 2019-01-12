import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService],
    }).compile();
    service = module.get<SearchService>(SearchService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
