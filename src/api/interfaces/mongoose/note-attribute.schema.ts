import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

export type NoteAttributeDocument = Interfaces.NoteAttribute & Document;

export const NoteAttributeSchema = new Schema({
  name: String,
  value: String, // ?
}, {
  minimize: false,
});
