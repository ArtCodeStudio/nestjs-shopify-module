import { Schema, Document, DocumentDefinition } from "mongoose";
import { Interfaces } from "shopify-admin-api";

export type AccessScopeDocument = DocumentDefinition<Interfaces.AccessScope> &
  Document;

export const AccessScopeSchema = new Schema({
  /**
   * The handle (name) for the access scope.
   */
  handle: String,
});
