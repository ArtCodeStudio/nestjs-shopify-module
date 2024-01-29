import { TRoles } from "./role";
import { Document, Types } from "mongoose";

import { IShopifyShop } from "../../shop/interfaces/shop";

export interface IShopifyConnect {
  _id: Types.ObjectId;
  shopifyID: number;
  myshopify_domain: string;
  accessToken: string;
  createdAt: Date;
  updatedAt: Date;
  roles: TRoles;
  shop: IShopifyShop;
}

export interface IShopifyConnectDocument extends IShopifyConnect, Document {
  _id: Types.ObjectId;
}
