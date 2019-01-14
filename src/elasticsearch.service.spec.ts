import { Test, TestingModule } from '@nestjs/testing';
import { ElasticsearchService } from './elasticsearch.service';

describe('ElasticsearchService', () => {
  let service: ElasticsearchService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElasticsearchService],
    }).compile();
    service = module.get<ElasticsearchService>(ElasticsearchService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
