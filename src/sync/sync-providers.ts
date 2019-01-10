import { Model, Mongoose } from 'mongoose';
import { 
  SyncProgressSchema, SyncProgressDocument,
  OrderSyncProgressSchema, OrderSyncProgressDocument,
  ProductSyncProgressSchema, ProductSyncProgressDocument,
} from '../interfaces';

 import { EventService } from '../event.service';

const syncProviders = (connection: Mongoose) => {
  return [
    {
      inject: [EventService],
      provide: 'SyncProgressModelToken',
      useFactory: (eventService: EventService) => {
        SyncProgressSchema.post('save', function(doc: SyncProgressDocument, next) {
          eventService.emit(`sync`, doc);
          if (doc.state !== 'running') {
            eventService.emit(`sync-ended`, doc);
            eventService.emit(`sync-ended:${doc.shop}`, doc);
            eventService.emit(`sync-ended:${doc.shop}:${doc._id}`, doc);
          }
          next();
        });
        ProductSyncProgressSchema.post('save', function(doc: ProductSyncProgressDocument, next) {
          eventService.emit(`sync:product`, doc);
          next();
        });
        OrderSyncProgressSchema.post('save', function(doc: OrderSyncProgressDocument, next) {
          eventService.emit(`sync:order`, doc);
          next();
        });
        return <Model<SyncProgressDocument>>connection.model(`shopify_sync-progress`, SyncProgressSchema)
      },
    },
  ];
}

export { syncProviders };