import { Schema, Document } from 'mongoose';
import { PaymentDetails } from 'shopify-prime/models';

export type PaymentDetailsDocument = PaymentDetails & Document;

export const PaymentDetailsSchema = new Schema({
  avs_result_code: String,
  credit_card_bin: String,
  cvv_result_code: String,
  credit_card_number: String,
  credit_card_company: String,
});
