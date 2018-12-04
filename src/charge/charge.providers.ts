import { Connection, Document, Model } from 'mongoose';
import { ShopifyPlanSchema } from './plan.schema';
import { IPlan, IPlanDocument } from './interfaces/plan'

const chargeProviders = [
  {
    provide: 'PlanModelToken',
    useFactory: (connection: Connection): Model<IPlanDocument> => connection.model('shopify_plan', ShopifyPlanSchema),
    inject: ['defaultDatabase'],
  },
];

export { chargeProviders };
