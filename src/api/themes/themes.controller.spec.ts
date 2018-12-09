import { Test, TestingModule } from '@nestjs/testing';
import { ThemesController } from './themes.controller';

describe('Themes Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ThemesController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ThemesController = module.get<ThemesController>(ThemesController);
    expect(controller).toBeDefined();
  });
});
