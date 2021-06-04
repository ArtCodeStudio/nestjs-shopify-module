import { Schema, Document, DocumentDefinition } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

export type PaymentDetailsDocument =
  DocumentDefinition<Interfaces.PaymentDetails> & Document;

export const PaymentDetailsSchema = new Schema(
  {
    avs_result_code: String,
    credit_card_bin: String,
    cvv_result_code: String,
    credit_card_number: String,
    credit_card_company: String,
  },
  {
    minimize: false,
  },
);
