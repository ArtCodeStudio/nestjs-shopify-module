import { Model, Mongoose } from 'mongoose';
import { 
  SyncProgressSchema, SyncProgressDocument,
} from '../interfaces';

 import { EventService } from '../event.service';

const syncProviders = (connection: Mongoose) => {
  return [
    {
      inject: [EventService],
      provide: 'SyncProgressModelToken',
      useFactory: (eventService: EventService) => {
        SyncProgressSchema.post('save', function(doc: SyncProgressDocument, next) {
          eventService.emit(`sync:${doc.shop}:${doc.id}`, doc);
          eventService.emit(`sync`, doc.shop, doc);
          if (doc.state !== 'running') {
            eventService.emit(`sync-ended:${doc.shop}:${doc._id}`, doc);
            eventService.emit(`sync-ended`, doc.shop, doc);
            switch (doc.state) {
              case 'success':
                eventService.emit(`sync-success`, doc.shop, doc);
                break;
              case 'failed':
                eventService.emit(`sync-failed`, doc.shop, doc);
                break;
              case 'cancelled':
                eventService.emit(`sync-cancelled`, doc.shop, doc);
                break;
            }
          }
          next();
        });
        return <Model<SyncProgressDocument>>connection.model(`shopify_sync-progress`, SyncProgressSchema)
      },
    },
  ];
}

export { syncProviders };