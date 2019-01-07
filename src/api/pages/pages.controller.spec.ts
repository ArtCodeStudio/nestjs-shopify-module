import { Test, TestingModule } from '@nestjs/testing';
import { PagesController } from './pages.controller';

describe('Pages Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [PagesController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: PagesController = module.get<PagesController>(PagesController);
    expect(controller).toBeDefined();
  });
});
