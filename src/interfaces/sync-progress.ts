import type { IStartSyncOptions } from "./sync-options";
import type { ISubSyncProgress, IOrderSyncProgress } from "./sub-sync-progress";
import type { Types } from "mongoose";

export interface ISyncProgress {
  _id: Types.ObjectId;
  shop: string;
  options: IStartSyncOptions;
  orders?: IOrderSyncProgress;
  products?: ISubSyncProgress;
  createdAt: Date;
  updatedAt: Date;
  state: "running" | "failed" | "cancelled" | "success" | "starting";
  lastError: string | null;
}
