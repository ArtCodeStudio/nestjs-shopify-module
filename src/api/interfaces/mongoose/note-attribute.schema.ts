import { Schema, Document } from 'mongoose';
import { NoteAttribute } from 'shopify-prime/models';

export type NoteAttributeDocument = NoteAttribute & Document;

export const NoteAttributeSchema = new Schema({
  name: String,
  value: String, // ?
}, {
  minimize: false,
});
