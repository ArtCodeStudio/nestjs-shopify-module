import { Schema } from 'mongoose';

export interface ICollectionImage {
  created_at: string,
  alt: string | null,
  width: number,
  height: number,
  src: string,
};

export const CollectionImageSchema = new Schema({
  id: {type: Number, index: {unique: true, sparse: true}},
  created_at: String,
  alt: String,
  width: Number,
  height: Number,
  src: String
});
