import { Schema, Document, DocumentDefinition } from "mongoose";
import { Interfaces } from "shopify-admin-api";

export type ThemeDocument = DocumentDefinition<Interfaces.Theme> & Document;

export const ThemeSchema = new Schema(
  {
    name: String,
    created_at: String,
    updated_at: String,
    role: String,
    theme_store_id: Number,
    previewable: Boolean,
    processing: Boolean,
  },
  {
    minimize: false,
  }
);
