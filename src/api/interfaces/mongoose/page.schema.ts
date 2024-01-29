import { Schema, Document, DocumentDefinition } from "mongoose";
import { Interfaces } from "shopify-admin-api";
import { MetafieldSchema } from "./metafield.schema";

export type PageDocument = DocumentDefinition<Interfaces.Page> & Document;

export const PageSchema = new Schema({
  id: { type: Number, index: { unique: true } },
  author: String,
  body_html: String,
  created_at: String,
  handle: String,
  metafield: MetafieldSchema,
  published_at: String,
  shop_id: String,
  template_suffix: String,
  title: String,
  updated_at: String,
});
