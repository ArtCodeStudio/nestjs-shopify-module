import { Test, TestingModule } from '@nestjs/testing';
import { ThemeController } from './theme.controller';

describe('Theme Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ThemeController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ThemeController = module.get<ThemeController>(ThemeController);
    expect(controller).toBeDefined();
  });
});
