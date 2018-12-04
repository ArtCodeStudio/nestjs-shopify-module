import * as mongoose from 'mongoose';

export const ShopifyPlanSchema = new mongoose.Schema({
  name: String,
  price: Number,
  test: Boolean,
  trial_days: Number,
  visible: Boolean,
  return_url: String,
});
