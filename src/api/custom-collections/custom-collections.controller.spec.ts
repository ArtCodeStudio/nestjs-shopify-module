import { Test, TestingModule } from '@nestjs/testing';
import { CustomCollectionsController } from './custom-collections.controller';

describe('CustomCollections Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [CustomCollectionsController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: CustomCollectionsController = module.get<CustomCollectionsController>(CustomCollectionsController);
    expect(controller).toBeDefined();
  });
});
