import { Schema, Document, DocumentDefinition } from "mongoose";
import { Interfaces } from "shopify-admin-api";

export type LocationDocument = DocumentDefinition<Interfaces.Location> &
  Document;

export const LocationSchema = new Schema(
  {
    id: { type: Number, index: { unique: true } },
    country_code: String,
    province_code: String,
    name: String,
    address1: String,
    address2: String,
    city: String,
    zip: String,
  },
  {
    minimize: false,
  }
);
