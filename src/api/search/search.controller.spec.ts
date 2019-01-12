import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';

describe('Search Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [SearchController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: SearchController = module.get<SearchController>(SearchController);
    expect(controller).toBeDefined();
  });
});
