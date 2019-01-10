import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';

describe('Sync Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [SyncController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: SyncController = module.get<SyncController>(SyncController);
    expect(controller).toBeDefined();
  });
});
