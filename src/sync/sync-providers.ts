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
          if (this.isNew) {
            // If this is a newly created progress, we register a one-time event callbacks delegating to the more globally scoped events.
            eventService.once(`sync-cancel:${doc.shop}:${doc.id}`, () => {
              eventService.emit(`sync-cancel`, doc.shop, doc);
            });
            eventService.once(`sync-cancelled:${doc.shop}:${doc.id}`, () => {
              eventService.emit(`sync-cancelled`, doc.shop, doc);
            });
            eventService.once(`sync-ended:${doc.shop}:${doc.id}`, () => {
              eventService.emit(`sync-ended`, doc.shop, doc);
            });
            eventService.once(`sync-ended:${doc.shop}:${doc.id}`, () => {
              eventService.emit(`sync-ended`, doc.shop, doc);
            });
            eventService.once(`sync:${doc.shop}:${doc.id}`, () => {
              eventService.emit(`sync`, doc.shop, doc);
            });
          }
          eventService.emit(`sync:${doc.shop}:${doc.id}`, doc);
          if (doc.state !== 'running') {
            eventService.emit(`sync-ended:${doc.shop}:${doc._id}`, doc);
          }
          next();
        });
        return <Model<SyncProgressDocument>>connection.model(`shopify_sync-progress`, SyncProgressSchema)
      },
    },
  ];
}

export { syncProviders };