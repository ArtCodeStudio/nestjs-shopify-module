import {  } from '@nestjs/common';
import { RecurringCharges } from 'shopify-prime';
import { ConfigService } from 'config.service';

/**
 * @see https://github.com/nozzlegear/Shopify-Prime#create-a-recurring-charge
 */
export class ChargeService extends RecurringCharges {

  protected return_url = `http://localhost:3000/shopify/charge/callback`;

  constructor(shopDomain: string, shopAccessToken: string) {
    super(shopDomain, shopAccessToken);
  }

  private getPlanByName(name: string) {
    const plans = ConfigService.charges.plans;
    for (const plan of plans) {
      if (plan.name === name) {
        return plan;
      }
    }
    return null;
  }

  /**
   * TODO save accepted plans in database
   * @param plan
   */
  async createByName(planName?: string) {
    let plan;
    if (!planName) {
      plan = this.getPlanByName('Default');
    } else {
      plan = this.getPlanByName(planName);
    }
    if (plan === null) {
      throw new Error('Charge not found');
    }
    return super.create(plan);
  }

  /**
   * Activates a previously accepted recurring application charge
   * @param id
   */
  async activate(id?: number) {
    if (id) {
      return super.activate(id);
    }
    this.list()
    .then((list) => {
      return super.activate(list[0].id);
    });
  }

}
