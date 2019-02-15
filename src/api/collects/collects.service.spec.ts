import { Test, TestingModule } from '@nestjs/testing';
import { CollectsService } from './collects.service';

describe('CollectsService', () => {
  let service: CollectsService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectsService],
    }).compile();
    service = module.get<CollectsService>(CollectsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
