import { Schema, Document, DocumentDefinition } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

export type NoteAttributeDocument =
  DocumentDefinition<Interfaces.NoteAttribute> & Document;

export const NoteAttributeSchema = new Schema(
  {
    name: String,
    value: String, // ?
  },
  {
    minimize: false,
  },
);
