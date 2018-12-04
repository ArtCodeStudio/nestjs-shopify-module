import { Inject } from '@nestjs/common';
import { RecurringCharges, Models } from 'shopify-prime';
import { Model, Types } from 'mongoose';
import { IShopifyConnect } from '../auth/interfaces/connect';

import { IAvailableCharge } from './interfaces/availableCharge';
import { IPlan, IPlanDocument } from './interfaces/plan';

/**
 * @see https://github.com/nozzlegear/Shopify-Prime#create-a-recurring-charge
 */
export class ChargeService {

  protected return_url = `http://localhost:3000/shopify/charge/callback`;

  constructor(
    @Inject('PlanModelToken')
    private readonly planModel: Model<IPlanDocument>,
  ) {}

  /**
   * Get a charge by id for Shopify user
   * @param plan
   */
  getChargeById(user: IShopifyConnect, id: number) {
    const recurringCharges = new RecurringCharges(user.myshopify_domain, user.accessToken);
    return recurringCharges.get(id);
  }

  /**
   * Get a charge by id for Shopify user
   * @param plan
   */
  listCharges(user: IShopifyConnect) {
    const recurringCharges = new RecurringCharges(user.myshopify_domain, user.accessToken);
    return recurringCharges.list();
  }

  /**
   * Get a charge by name from the available plans in the database
   * @param plan
   */
  private getPlanByName(name: string) {
    let query: any = { name };
    return this.planModel.findOne(query).exec();
  }

  /**
   * Create a new charge, if plan was already accepted just activate this charge
   * @param plan
   */
  async createByName(user: IShopifyConnect, planName: string = 'Default') {
    const plan = await this.getPlanByName(planName);

    if (!plan) {
      throw new Error('Charge not found');
    }

    // Check if the plan was already accepted
    const recurringCharges = new RecurringCharges(user.myshopify_domain, user.accessToken);
    return recurringCharges.list()
    .then(async (prevPlans) => {
      for (const prevPlan of prevPlans) {
        if (
          plan.name === prevPlan.name &&
          plan.price === prevPlan.price &&
          plan.test === prevPlan.test &&
          plan.return_url === prevPlan.return_url &&
          prevPlan.status === 'accepted'
        ) {
          return this.activate(user, prevPlan.id)
          .then(() => {
            return prevPlan;
          });
        }
      }
      // If plan was not activated before, create it
      return recurringCharges.create(plan);
    });

  }

  /**
   * Activates a previously accepted recurring application charge passed by id
   * If no id is passed activate the first plan which is already accepted.
   * @param id charge id
   */
  async activate(user: IShopifyConnect, id?: number) {
    const recurringCharges = new RecurringCharges(user.myshopify_domain, user.accessToken);
    if (id) {
      return recurringCharges.activate(id);
    }
    return recurringCharges.list()
    .then(async (charges) => {
      for (const charge of charges) {
        if (charge.status === 'accepted') {
          return recurringCharges.activate(charge.id);
        }
      }
      throw new Error('No accepted plan found!');
    });
  }

  /**
   * Get the current active charge or null if no active charge is found.
   */
  async active(user: IShopifyConnect): Promise<Models.RecurringCharge | null> {
    const charges = new RecurringCharges(user.myshopify_domain, user.accessToken);
    return charges.list()
    .then(async (charges) => {
      for (const charge of charges) {
        if (charge.status === 'active') {
          return charge;
        }
      }
      return null;
    });
  }

  /**
   * Get available plans for this app (found in config)
   * @param all If true also hidden plans returned
   */
  async available(user: IShopifyConnect, all: boolean = false) {
    return this.active(user)
    .then(async (activePlan) => {
      const plans: IAvailableCharge[] = [];
      const allPlans: IPlan[] = await this.planModel.find().exec();
      for (const plan of allPlans) {
        const availablePlan: IAvailableCharge = {
          name: plan.name,
          price: plan.price,
          test: plan.test,
          trial_days: plan.trial_days,
          active: false,
        };

        // Check if the plan is active
        if (
          activePlan &&
          plan.name === activePlan.name &&
          Number(plan.price) === Number(activePlan.price) &&
          plan.test === activePlan.test &&
          plan.return_url === activePlan.return_url
        ) {
          availablePlan.active = true;
        }

        // push if all plans should pushed pr plan is visible or plan is active
        if (all || plan.visible || availablePlan.active) {
          plans.push(availablePlan);
        }
      }
      return plans;
    });

  }
}
