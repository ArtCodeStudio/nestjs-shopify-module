import { Model, Mongoose } from "mongoose";
import { SyncProgressSchema, SyncProgressDocument } from "../interfaces";

import { EventService } from "../event.service";

import { DebugService } from "../debug.service";

const logger = new DebugService("shopify:sync-providers");

/**
 *
 * @param connection
 *
 * @event sync:[shop]:[progress_.id] (progress: SyncProgressDocument)
 * @event sync (shop: string, progress: SyncProgressDocument)
 * @event sync-ended:[shop]:[progress._id] (progress: SyncProgressDocument)
 * @event sync-ended (shop: string, progress: SyncProgressDocument)
 * @event sync-success (shop: string, progress: SyncProgressDocument)
 * @event sync-failed (shop: string, progress: SyncProgressDocument)
 * @event sync-cancelled (shop: string, progress: SyncProgressDocument)
 */
const syncProviders = (connection: Mongoose) => {
  return [
    {
      inject: [EventService],
      provide: "SyncProgressModelToken",
      useFactory: (eventService: EventService) => {
        SyncProgressSchema.post(
          "save",
          (progress: SyncProgressDocument, next) => {
            logger.debug(
              `SyncProgress Post save hook:`,
              progress.id,
              progress._id,
              progress.state
            );
            // logger.debug(`emit sync:${progress.shop}:${progress._id}`, progress);
            eventService.emit(
              `sync:${progress.shop}:${progress._id}`,
              progress
            );
            // logger.debug(`emit sync`, progress.shop, progress);
            eventService.emit(`sync`, progress.shop, progress);
            if (progress.state !== "running") {
              // logger.debug(`emit sync-ended:${progress.shop}:${progress._id}`, progress);
              eventService.emit(
                `sync-ended:${progress.shop}:${progress._id}`,
                progress
              );
              // logger.debug(`emit sync-ended`, progress.shop, progress);
              eventService.emit(`sync-ended`, progress.shop, progress);
              switch (progress.state) {
                case "success":
                  // logger.debug(`emit sync-success`, progress.shop, progress);
                  eventService.emit(`sync-success`, progress.shop, progress);
                  break;
                case "failed":
                  // logger.debug(`emit sync-failed`, progress.shop, progress);
                  eventService.emit(`sync-failed`, progress.shop, progress);
                  break;
                case "cancelled":
                  // logger.debug(`emit sync-cancelled`, progress.shop, progress);
                  eventService.emit(`sync-cancelled`, progress.shop, progress);
                  break;
              }
            }
            next(null);
          }
        );
        return (connection.model(
          `shopify_sync-progress`,
          SyncProgressSchema
        ) as unknown) as Model<SyncProgressDocument>;
      },
    },
  ];
};

export { syncProviders };
