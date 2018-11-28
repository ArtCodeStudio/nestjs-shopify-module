import { Test, TestingModule } from '@nestjs/testing';
import { LocalesController } from './locales.controller';

describe('Locales Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [LocalesController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: LocalesController = module.get<LocalesController>(LocalesController);
    expect(controller).toBeDefined();
  });
});
