import { Test, TestingModule } from '@nestjs/testing';
import { ChargeController } from './charge.controller';

describe('Charge Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ChargeController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ChargeController = module.get<ChargeController>(ChargeController);
    expect(controller).toBeDefined();
  });
});
