import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';

describe('Transactions Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [TransactionsController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: TransactionsController = module.get<TransactionsController>(TransactionsController);
    expect(controller).toBeDefined();
  });
});
