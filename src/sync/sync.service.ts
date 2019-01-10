import { Connection, Document, Model, Mongoose } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { EventService } from '../event.service';
import { OrdersService } from '../api/orders/orders.service';
import { ProductsService } from '../api/products/products.service';
import { IShopifyConnect } from '../auth/interfaces/connect';
import { DebugService } from '../debug.service';
import { ISyncOptions, SyncProgressSchema, SyncProgressDocument } from '../interfaces';

@Injectable()
export class SyncService {
  constructor(
    @Inject('SyncProgressModelToken')
    private readonly syncProgressModel: Model<SyncProgressDocument>,
    private readonly eventService: EventService,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
  ) {}
  logger = new DebugService(`shopify:${this.constructor.name}`);
  
  async startSync(shopifyConnect: IShopifyConnect, options?: ISyncOptions): Promise<SyncProgressDocument> {

    this.logger.debug(`startSync(${JSON.stringify(options, null, 2)}`);
    options = options || {
      // Continue the previous sync by default (don't resync completely)
      resync: false,
      // Include orders and products but not transactions by default
      includeOrders: true,
      includeProducts: true,
      includeTransactions: false,
      includePages: false,
      includeCustomCollection: false,
      includeSmartCollection: false,
      cancelExisting: false,
    };

    // If neither includeOrders nor includeProducts was passed, we assume by default that both should be included
    if (!options.includeOrders && !options.includeProducts) {
      options.includeOrders = true;
      options.includeProducts = true;
    }

    this.logger.debug(`startSync(${JSON.stringify(options, null, 2)}`);
    this.logger.debug(
      `startSync(
        myShopifyDomain=${shopifyConnect.shop.myshopify_domain},
        resync=${options.resync},
        includeProducts=${options.includeProducts},
        includeOrders=${options.includeOrders},
        includeTransactions=${options.includeTransactions},
        cancelExisting=${options.cancelExisting},
    )`);

    // Get the last sync progress (if it exists)
    let lastProgress: SyncProgressDocument = await this.syncProgressModel.findOne(
      { shop: shopifyConnect.shop.myshopify_domain },
      {},
      { sort: { 'createdAt': -1} }
    );

    if (lastProgress && lastProgress.state === 'running') {

      this.logger.debug('check if last progress is still running');
      const lastProgressRunning = await new Promise(resolve => {
        this.eventService.once(`sync-pong:${lastProgress._id}`, () => resolve(true));
        this.eventService.emit(`sync-ping:${lastProgress._id}`);
        setTimeout(() => resolve(false), 5000);
      });

      if (!lastProgressRunning) {
        this.logger.debug('last progress has failed');
        lastProgress.state = 'failed';
        lastProgress.lastError = 'sync timed out';
        await lastProgress.save();
      } else {
        // If the last progress is still running and includes all the options we need, we just return it, without starting a new one.
        // If the options of the running progress and the sync we want to start are incompatible, we throw a `sync in progress` error,
        // or we cancel the previous progress and start a new one if `cancelExisting` option is set.

        const checkOptions = [
          'includeProducts',
          'includeOrders',
          'includeTransactions',
          'resync'
        ];

        // If `cancelExisting` option is set, we cancel the existing running progress unless it is compatible with our options.
        const cancelledExisting = checkOptions.some(key => {
          if (options[key] && !lastProgress.options[key]) {
            if (options.cancelExisting) {
              this.eventService.emit(`sync-cancel:${lastProgress._id}`);
              return true;
            } else {
              throw new Error('sync in progress');
            }
          }
          return false;
        });

        if (!cancelledExisting) {
          // The existing running progress is compatible with all the options we want, so we just return it without starting a new one.
          this.eventService.emit(`sync`, lastProgress);
          return lastProgress;
        }
      }
    }

    const productSyncOptions = {
      resync: !!options.resync,
    }

    const orderSyncOptions = {
      resync: !!options.resync,
      includeTransactions: !!options.includeTransactions,
    }

    const progress: SyncProgressDocument = await this.syncProgressModel.create({
      shop: shopifyConnect.shop.myshopify_domain,
      options,
      state: 'running',
      lastError: null,
    });

    if (options.includeProducts) {
      await this.productsService.startSync(shopifyConnect, productSyncOptions, progress);
    }

    if (options.includeOrders) {
      await this.ordersService.startSync(shopifyConnect, orderSyncOptions, progress);
    }

    return progress;
  }

  async find(query: Partial<SyncProgressDocument>, options?: {}): Promise<SyncProgressDocument[]|null> {
    return await this.syncProgressModel.find(query, {}, options).lean();
  }

  async findOne(query: Partial<SyncProgressDocument>, options?: {}): Promise<SyncProgressDocument|null> {
    return await this.syncProgressModel.findOne(query, {}, options).lean();
  }

  async cancelShopSync(shopifyConnect: IShopifyConnect, id?: string) {
    const shop: string = shopifyConnect.shop.myshopify_domain;
    if (!id) {
      const lastProgress = await this.syncProgressModel.findOne(
        { shop },
        { _id: true },
        { sort: { 'createdAt': -1} }
      ).lean();
      if (lastProgress) {
        id = lastProgress._id;
      }
    }
    if (!id) {
      return null;
    }
    // Give five seconds time for the progress to be cancelled. If no response, we throw a `sync progress hanging` error.
    // If responding to cancellation, we wait for the `sync-ended` event.
    return new Promise((resolve, reject) => {
      let cancelled = false;
      this.eventService.once(`sync-cancelled:${shop}:${id}`, () => {
        cancelled = true;
      });
      this.eventService.once(`sync-ended:${shop}:${id}`, progress => resolve(progress));
      this.eventService.emit(`sync-cancel:${shop}:${id}`);
      setTimeout(() => {
        if (!cancelled) {
          reject(new Error('sync progress hanging'));
        }
      }, 5000);
    });
  }

}
