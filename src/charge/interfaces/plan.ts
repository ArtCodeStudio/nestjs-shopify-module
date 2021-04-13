import { Document } from "mongoose";

export interface IPlan {
  name: string;
  price: number;
  test: boolean;
  trial_days: number;
  visible: boolean;
  return_url: string;
}

export interface IPlanDocument extends IPlan, Document {}
