import { Connection, Document, Model } from 'mongoose';
import { ShopifyPlanSchema } from './plan.schema';
import { IPlan } from './interfaces/plan'

const chargeProviders = [
  {
    provide: 'PlanModelToken',
    useFactory: (connection: Connection): Model<IPlan> => connection.model('shopify_plan', ShopifyPlanSchema),
    inject: ['defaultDatabase'],
  },
];

export { chargeProviders };
