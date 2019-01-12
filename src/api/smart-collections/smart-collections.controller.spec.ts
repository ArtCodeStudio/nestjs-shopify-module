import { Test, TestingModule } from '@nestjs/testing';
import { SmartCollectionsController } from './smart-collections.controller';

describe('SmartCollections Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [SmartCollectionsController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: SmartCollectionsController = module.get<SmartCollectionsController>(SmartCollectionsController);
    expect(controller).toBeDefined();
  });
});
