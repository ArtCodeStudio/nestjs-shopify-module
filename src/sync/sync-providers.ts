import { Model, Mongoose } from 'mongoose';
import { 
  SyncProgressSchema, SyncProgressDocument,
  OrderSyncProgressSchema,
  ProductSyncProgressSchema,
} from './sync-progress.schema';

 import { EventService } from '../event.service';

const syncProviders = (connection: Mongoose) => {
  return [
    {
      inject: [EventService],
      provide: 'SyncProgressModelToken',
      useFactory: (eventService: EventService) => {
        SyncProgressSchema.post('save', function(doc, next) {
          eventService.emit(`sync`, doc);
          next();
        });
        ProductSyncProgressSchema.post('save', function(doc, next) {
          eventService.emit(`sync:product`, doc);
          next();
        });
        OrderSyncProgressSchema.post('save', function(doc, next) {
          eventService.emit(`sync:order`, doc);
          next();
        });
        return <Model<SyncProgressDocument>>connection.model(`shopify_sync-progress`, SyncProgressSchema)
      },
    },
  ];
}

export { syncProviders };