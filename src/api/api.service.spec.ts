import { Test, TestingModule } from '@nestjs/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiService],
    }).compile();
    service = module.get<ApiService>(ApiService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
