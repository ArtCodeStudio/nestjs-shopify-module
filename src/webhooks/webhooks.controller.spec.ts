import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';

describe('Webhooks Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [WebhooksController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: WebhooksController = module.get<WebhooksController>(WebhooksController);
    expect(controller).toBeDefined();
  });
});
